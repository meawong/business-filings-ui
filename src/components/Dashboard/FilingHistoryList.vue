<template>
  <div id="filing-history-list">
    <AddCommentDialog
      :dialog="isAddCommentDialog"
      :filing="getCurrentFiling"
      attach="#filing-history-list"
      @close="hideCommentDialog($event)"
    />

    <DownloadErrorDialog
      :dialog="isDownloadErrorDialog"
      attach="#filing-history-list"
      @close="setDownloadErrorDialog(false)"
    />

    <LoadCorrectionDialog
      :dialog="isLoadCorrectionDialog"
      attach="#filing-history-list"
      @exit="setLoadCorrectionDialog(false)"
    />

    <FileCorrectionDialog
      :dialog="isFileCorrectionDialog"
      attach="#filing-history-list"
      @exit="setFileCorrectionDialog(false)"
      @redirect="redirectFiling($event)"
    />

    <!-- Court order notification -->
    <v-card
      v-if="hasCourtOrders"
      class="my-6 pa-6"
      elevation="0"
    >
      <v-icon>mdi-gavel</v-icon>
      <span class="ml-1">Court order(s) have been filed on this company. Review the filing history for impacts
        to business information.</span>
    </v-card>

    <div
      v-if="showHistoryPanel"
      class="scrollable-container"
    >
      <v-expansion-panels :value="getPanel">
        <component
          :is="is(filing)"
          v-for="(filing, index) in getFilings"
          :key="index"
          :filing="filing"
          :index="index"
        />
      </v-expansion-panels>
    </div>

    <!-- No Results Message -->
    <v-card
      v-if="!showHistoryPanel"
      class="no-results"
      flat
    >
      <v-card-text>
        <template v-if="isTemporaryRegistration">
          <div class="no-results__subtitle">
            Complete your filing to display
          </div>
        </template>

        <template v-if="isBusiness">
          <div class="no-results__title">
            You have no filing history
          </div>
          <div class="no-results__subtitle">
            Your completed filings and transactions will appear here
          </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { Action, Getter } from 'pinia-class'
import { AddCommentDialog, DownloadErrorDialog, FileCorrectionDialog, LoadCorrectionDialog }
  from '@/components/dialogs'
import { CorrectionTypes } from '@/enums'
import { ApiFilingIF } from '@/interfaces'
import { FilingMixin } from '@/mixins'
import { EnumUtilities, LegalServices } from '@/services/'
import { navigate } from '@/utils'
import * as Filings from './FilingHistoryList/filings'
import { useBusinessStore, useConfigurationStore, useFilingHistoryListStore, useRootStore } from '@/stores'

@Component({
  components: {
    ...Filings,
    AddCommentDialog,
    DownloadErrorDialog,
    FileCorrectionDialog,
    LoadCorrectionDialog
  }
})
export default class FilingHistoryList extends Mixins(FilingMixin) {
  @Prop({ default: null }) readonly highlightId!: number

  @Getter(useFilingHistoryListStore) getCurrentFiling!: ApiFilingIF
  @Getter(useConfigurationStore) getEditUrl!: string
  @Getter(useFilingHistoryListStore) getFilings!: Array<ApiFilingIF>
  @Getter(useFilingHistoryListStore) getPanel!: number
  @Getter(useBusinessStore) hasCourtOrders!: boolean
  @Getter(useFilingHistoryListStore) isAddCommentDialog!: boolean
  @Getter(useFilingHistoryListStore) isDownloadErrorDialog!: boolean
  @Getter(useFilingHistoryListStore) isLoadCorrectionDialog!: boolean
  @Getter(useFilingHistoryListStore) isFileCorrectionDialog!: boolean

  @Action(useFilingHistoryListStore) hideCommentDialog!: (x: boolean) => Promise<void>
  @Action(useFilingHistoryListStore) toggleFilingHistoryItem!: (x: number) => Promise<void>
  @Action(useFilingHistoryListStore) setDownloadErrorDialog!: (x: boolean) => void
  @Action(useRootStore) setFetchingDataSpinner!: (x: boolean) => void
  @Action(useFilingHistoryListStore) setFileCorrectionDialog!: (x: boolean) => void
  @Action(useFilingHistoryListStore) setLoadCorrectionDialog!: (x: boolean) => void

  /** Whether this entity is a business (and not a temporary registration). */
  get isBusiness (): boolean {
    return !!sessionStorage.getItem('BUSINESS_ID')
  }

  /** Whether this entity is a temporary registration (and not a business). */
  get isTemporaryRegistration (): boolean {
    return !!sessionStorage.getItem('TEMP_REG_NUMBER')
  }

  /** Whether to show the history panel. */
  get showHistoryPanel () {
    return (this.getFilings.length > 0)
  }

  /** Returns the name of the sub-component to use for the specified filing. */
  is (filing: ApiFilingIF): string {
    switch (true) {
      case filing.availableOnPaperOnly: return 'paper-filing' // must come first
      case EnumUtilities.isTypeAgmExtension(filing): return 'agm-extension'
      case EnumUtilities.isTypeAlteration(filing): return 'alteration-filing'
      case EnumUtilities.isTypeAmalgamationApplication(filing): return 'amalgamation-filing'
      case EnumUtilities.isTypeChangeOfAddress(filing): return 'change-of-address'
      case EnumUtilities.isTypeConsentContinuationOut(filing): return 'consent-continuation-out'
      case EnumUtilities.isTypeContinuationIn(filing): return 'continuation-in'
      case EnumUtilities.isTypeContinuationOut(filing): return 'continuation-out'
      case EnumUtilities.isTypeDissolutionVoluntary(filing): return 'dissolution-voluntary'
      case EnumUtilities.isTypeIncorporationApplication(filing): return 'incorporation-application'
      case EnumUtilities.isTypeRestorationLimited(filing): return 'limited-restoration'
      case EnumUtilities.isTypeRestorationLimitedExtension(filing): return 'limited-restoration-extension'
      case EnumUtilities.isTypeRestorationLimitedToFull(filing): return 'limited-restoration-conversion'
      case EnumUtilities.isTypeNoticeOfWithdrawal(filing): return 'notice-of-withdrawal'
      case EnumUtilities.isTypeRegistration(filing): return 'registration-filing'
      case EnumUtilities.isTypeStaff(filing): return 'staff-filing' // includes several filing types
      default: return 'default-filing'
    }
  }

  /**
   * Creates a draft correction and redirects to Edit UI.
   * Called by File Correction Dialog.
   **/
  async redirectFiling (correctionType: CorrectionTypes): Promise<void> {
    try {
      // show spinner since the network calls below can take a few seconds
      this.setFetchingDataSpinner(true)

      // build correction filing
      const correctionFiling = this.buildCorrectionFiling(this.getCurrentFiling, correctionType)

      // save draft filing
      const draftCorrection = await LegalServices.createFiling(this.getIdentifier, correctionFiling, true)
      const draftCorrectionId = +draftCorrection?.header?.filingId
      if (isNaN(draftCorrectionId)) {
        throw new Error('Invalid API response')
      }

      // navigate to Edit UI to complete this correction
      // NB: no need to clear spinner
      const correctionUrl =
        `${this.getEditUrl}${this.getIdentifier}/correction/?correction-id=${draftCorrectionId}`
      navigate(correctionUrl)
    } catch (error) {
      // clear spinner on error
      this.setFetchingDataSpinner(false)

      // eslint-disable-next-line no-console
      console.log('Error creating correction =', error)
      this.setLoadCorrectionDialog(true)
    }
  }

  /**
   * This is called when filings are initially fetched.
   * If there is a filing ID to highlight then it finds it and expands its panel.
   */
  @Watch('getFilings', { immediate: true })
  async onFilingsChange (): Promise<void> {
    // if needed, highlight a specific filing
    if (this.highlightId) {
      const index = this.getFilings.findIndex(f => (f.filingId === this.highlightId))
      if (index >= 0) { // safety check
        await this.toggleFilingHistoryItem(index)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/theme.scss";

.v-icon.mdi-gavel {
  color: $gray9;
}

.scrollable-container {
  max-height: 60rem;
}

:deep(.v-expansion-panel-header) {
  min-height: auto !important;
  padding: 0;
  margin-top: 0.25rem;
}

// specifically enable anchors, buttons, the pending alert icon and tooltips
// for this page and sub-components
:deep() {
  a,
  .v-btn,
  .pending-alert .v-icon,
  .v-tooltip + div {
    pointer-events: auto;
  }
}

:deep(.v-expansion-panel-content__wrap) {
  padding: 0;
}

:deep(.theme--light.v-list-item--disabled) {
  opacity: 0.38 !important;
}
</style>
