<template>
  <div id="office-addresses">
    <v-card flat>
      <ul
        class="list address-list"
        :class="{ 'show-address-form' : showAddressForm }"
      >
        <!-- Registered Office Section -->
        <div
          v-if="showAddressForm"
          class="address-edit-header"
        >
          <label class="address-edit-title">Registered Office</label>
        </div>

        <!-- Registered Delivery Address -->
        <li class="address-list-container registered-delivery-address">
          <div class="meta-container">
            <label v-if="!showAddressForm">Registered Office</label>
            <label v-else>Delivery Address</label>

            <div class="meta-container__inner">
              <label v-if="!showAddressForm"><strong>Delivery Address</strong></label>

              <div class="address-wrapper">
                <span v-if="isEmptyObject(deliveryAddress) && !showAddressForm">(Not entered)</span>
                <delivery-address
                  v-else
                  :address="deliveryAddress"
                  :editing="showAddressForm"
                  :schema="officeAddressSchema"
                  @update:address="updateBaseAddress(deliveryAddress, $event)"
                  @valid="deliveryAddressValid=$event"
                />
              </div>

              <!-- Change and Reset Buttons -->
              <v-expand-transition>
                <div class="address-block__actions">
                  <v-btn
                    v-if="!showAddressForm && componentEnabled"
                    id="reg-off-addr-change-btn"
                    color="primary"
                    text
                    small
                    @click="showAddressForm=true"
                  >
                    <v-icon small>
                      mdi-pencil
                    </v-icon>
                    <span>Change</span>
                  </v-btn>
                  <br>
                  <v-btn
                    v-if="!showAddressForm && anyModified"
                    id="reg-off-addr-reset-btn"
                    class="reset-btn"
                    color="error"
                    outlined
                    small
                    @click="resetAddresses()"
                  >
                    <span>Reset</span>
                  </v-btn>
                </div>
              </v-expand-transition>
            </div>
          </div>
        </li>

        <!-- Registered Mailing Address -->
        <li class="address-list-container registered-mailing-address">
          <div class="meta-container">
            <label>{{ showAddressForm ? "Mailing Address" : "" }}</label>
            <div class="meta-container__inner">
              <label
                v-if="!showAddressForm"
              >
                <strong>Mailing Address</strong>
              </label>
              <div class="form__row">
                <v-checkbox
                  v-if="showAddressForm"
                  v-model="inheritDeliveryAddress"
                  class="inherit-checkbox"
                  label="Same as Delivery Address"
                />
              </div>
              <span v-if="isEmptyObject(mailingAddress) && !showAddressForm">(Not entered)</span>
              <div
                v-else-if="showAddressForm ||
                  !isSame(deliveryAddress, mailingAddress, ['actions','addressType'])"
                class="address-wrapper"
              >
                <mailing-address
                  v-if="!showAddressForm || !inheritDeliveryAddress"
                  :address="mailingAddress"
                  :editing="showAddressForm"
                  :schema="officeAddressSchema"
                  @update:address="updateBaseAddress(mailingAddress, $event)"
                  @valid="mailingAddressValid=$event"
                />
              </div>
              <span
                v-else
                id="regMailSameAsDeliv"
              >Mailing Address same as above</span>
            </div>
          </div>
        </li>

        <div v-if="isBaseCompany">
          <div
            v-if="showAddressForm"
            class="address-edit-header"
          >
            <label class="address-edit-title">Records Office</label>
            <v-checkbox
              v-if="showAddressForm"
              v-model="inheritRegisteredAddress"
              class="records-inherit-checkbox"
              label="Same as Registered Office"
            />
          </div>

          <div v-if="!inheritRegisteredAddress">
            <!-- Records Delivery Address -->
            <li class="address-list-container records-delivery-address">
              <div class="meta-container">
                <label v-if="!showAddressForm">Records Office</label>
                <label v-else>Delivery Address</label>

                <div class="meta-container__inner">
                  <label v-if="!showAddressForm"><strong>Delivery Address</strong></label>
                  <div class="address-wrapper">
                    <span v-if="isEmptyObject(recDeliveryAddress) && !showAddressForm">(Not entered)</span>
                    <delivery-address
                      :address="recDeliveryAddress"
                      :editing="showAddressForm"
                      :schema="officeAddressSchema"
                      @update:address="updateBaseAddress(recDeliveryAddress, $event)"
                      @valid="recDeliveryAddressValid=$event"
                    />
                  </div>
                </div>
              </div>
            </li>

            <!-- Records Mailing Address -->
            <li class="address-list-container records-mailing-address">
              <div class="meta-container">
                <label>{{ showAddressForm ? "Mailing Address" : "" }}</label>
                <div class="meta-container__inner">
                  <label
                    v-if="(!showAddressForm &&
                      !isSame(recDeliveryAddress, recMailingAddress, ['actions','addressType'])) ||
                      isEmptyObject(recMailingAddress)"
                  >
                    <strong>Mailing Address</strong>
                  </label>
                  <div class="form__row">
                    <v-checkbox
                      v-if="showAddressForm"
                      v-model="inheritRecDeliveryAddress"
                      class="inherit-checkbox"
                      label="Same as Delivery Address"
                    />
                  </div>
                  <span v-if="isEmptyObject(recMailingAddress) && !showAddressForm">(Not entered)</span>
                  <div
                    v-else-if="showAddressForm ||
                      !isSame(recDeliveryAddress, recMailingAddress, ['actions','addressType'])"
                    class="address-wrapper"
                  >
                    <mailing-address
                      v-if="!showAddressForm || !inheritRecDeliveryAddress"
                      :address="recMailingAddress"
                      :editing="showAddressForm"
                      :schema="officeAddressSchema"
                      @update:address="updateBaseAddress(recMailingAddress, $event)"
                      @valid="recMailingAddressValid=$event"
                    />
                  </div>
                  <span
                    v-else
                    id="recMailSameAsDeliv"
                  >Mailing Address same as above</span>
                </div>
              </div>
            </li>
          </div>

          <div v-else>
            <li
              v-if="!showAddressForm"
              class="address-list-container"
            >
              <div class="meta-container">
                <label>Records Office</label>
                <div class="meta-container__inner">
                  <span id="recSameAsReg">Same as Registered Office</span>
                </div>
              </div>
            </li>
          </div>
        </div>

        <!-- Form Button Section -->
        <li>
          <div
            v-show="showAddressForm"
            class="form__row form__btns"
          >
            <v-btn
              id="reg-off-update-addr-btn"
              class="update-btn"
              color="primary"
              :disabled="!formValid"
              @click="updateAddresses()"
            >
              <span>Update Addresses</span>
            </v-btn>
            <v-btn
              id="reg-off-cancel-addr-btn"
              @click="cancelEditAddresses()"
            >
              <span>Cancel</span>
            </v-btn>
          </div>
        </li>
      </ul>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Watch } from 'vue-property-decorator'
import axios from '@/axios-auth'
import { isEmpty } from 'lodash'
import { Getter } from 'pinia-class'
import { StatusCodes } from 'http-status-codes'
import { officeAddressSchema } from '@/schemas'
import { BaseAddress } from '@bcrs-shared-components/base-address'
import { CommonMixin } from '@/mixins'
import { RegRecAddressesIF, AddressIF } from '@/interfaces'
import { Actions } from '@/enums'
import { useBusinessStore, useConfigurationStore } from '@/stores'

@Component({
  components: {
    'delivery-address': BaseAddress,
    'mailing-address': BaseAddress
  }
})
export default class OfficeAddresses extends Mixins(CommonMixin) {
  /** Indicates whether this component should be enabled or not. */
  @Prop({ default: true }) readonly componentEnabled!: boolean

  /**
   * Addresses object from parent page, used to set our working addresses (4 properties below).
   * As needed, we emit this back to parent (ie, update/sync).
   */
  @Prop({ default: () => {} }) readonly addresses!: RegRecAddressesIF

  // @Getter(useBusinessStore) getIdentifier!: string
  @Getter(useBusinessStore) isBaseCompany!: boolean
  @Getter(useConfigurationStore) getLegalApiUrl!: string

  /** Effective date for fetching office addresses. */
  asOfDate: string

  /** Original addresses object from Legal API. */
  original = {} as RegRecAddressesIF

  // Working addresses data (also used as v-models for the BaseAddress components)
  deliveryAddress = {} as AddressIF
  mailingAddress = {} as AddressIF
  recDeliveryAddress = {} as AddressIF
  recMailingAddress = {} as AddressIF

  // Validation events from BaseAddress components
  deliveryAddressValid = true
  mailingAddressValid = true
  recDeliveryAddressValid = true
  recMailingAddressValid = true

  /** Whether to show the editable form for an address (true) or the static display address (false). */
  showAddressForm = false

  /** V-model for "Registered Mailing Address same as Registered Delivery Address" checkbox. */
  inheritDeliveryAddress = true

  /** V-model for "Records Mailing Address same as Records Delivery Address" checkbox. */
  inheritRecDeliveryAddress = true

  /** V-model for "Records Addresses same as Registered Addresses" checkbox. */
  inheritRegisteredAddress = true

  /** The Address schema containing Vuelidate rules. */
  officeAddressSchema = officeAddressSchema

  /** Whether the address form is valid. */
  get formValid (): boolean {
    return (
      (this.deliveryAddressValid && (this.inheritDeliveryAddress || this.mailingAddressValid)) &&
      (this.inheritRegisteredAddress ||
        (this.recDeliveryAddressValid && (this.inheritRecDeliveryAddress || this.recMailingAddressValid))
      )
    )
  }

  /** Whether any address has been modified from the original. */
  get anyModified (): boolean {
    return (
      !this.isSame(this.deliveryAddress, this.original?.registeredOffice?.deliveryAddress, ['actions']) ||
      !this.isSame(this.mailingAddress, this.original?.registeredOffice?.mailingAddress, ['actions']) ||
      !this.isSame(this.recDeliveryAddress, this.original?.recordsOffice?.deliveryAddress, ['actions']) ||
      !this.isSame(this.recMailingAddress, this.original?.recordsOffice?.mailingAddress, ['actions'])
    )
  }

  /** Fetches the office addresses on As Of Date from the Legal API. */
  // FUTURE: this API call should be in the parent component or some mixin/service
  async fetchAddresses (): Promise<void> {
    if (this.getIdentifier && this.asOfDate) {
      // initialize the original address
      this.original = {
        registeredOffice: {
          deliveryAddress: { actions: [] } as AddressIF,
          mailingAddress: { actions: [] } as AddressIF
        },
        recordsOffice: {
          deliveryAddress: { actions: [] } as AddressIF,
          mailingAddress: { actions: [] } as AddressIF
        }
      } as RegRecAddressesIF

      const url = `${this.getLegalApiUrl}businesses/${this.getIdentifier}/addresses?date=${this.asOfDate}`
      await axios.get(url).then(response => {
        // registered office is required for all companies
        const registeredOffice = response?.data?.registeredOffice
        if (registeredOffice) {
          this.original.registeredOffice = {
            deliveryAddress: { ...registeredOffice.deliveryAddress, actions: [] },
            mailingAddress: { ...registeredOffice.mailingAddress, actions: [] }
          }
        }

        // records office is required for base companies
        const recordsOffice = response?.data?.recordsOffice
        if (recordsOffice) {
          this.original.recordsOffice = {
            deliveryAddress: { ...recordsOffice.deliveryAddress, actions: [] },
            mailingAddress: { ...recordsOffice.mailingAddress, actions: [] }
          }
        } else if (!this.isBaseCompany) {
          this.original.recordsOffice = null
        }
      }).catch(error => {
        if (error.response.status === StatusCodes.NOT_FOUND) return
        // eslint-disable-next-line no-console
        console.log('fetchAddresses() error =', error)
        // re-throw error
        throw error
      })
    }
  }

  /** Called externally to _asynchronously_ get the original office addresses on As Of Date. */
  // FUTURE: this logic should be in the parent component
  public async getOrigAddresses (asOfDate: string, updateWorkingAddresses: boolean): Promise<void> {
    this.asOfDate = asOfDate

    try {
      // fetch original office addresses
      await this.fetchAddresses()
      this.emitOriginalAddresses()

      if (updateWorkingAddresses) {
        // fill working addresses from original and sync them with parent
        this.fillWorkingAddresses(this.original)
        this.emitWorkingAddresses()
        this.emitModified()
      }
      this.emitValid()
    } catch {
      // emit event to parent to display Fetch Error Dialog
      this.$root.$emit('fetch-error-event')
    }
  }

  /**
   * Called when Addresses prop changes - this is how we get our working addresses, eg:
   * - after we emit our working addresses (ie, sync)
   * - when a draft filing is loaded
   **/
  @Watch('addresses', { deep: true })
  onAddressesChanged (): void {
    // fill working addresses from parent
    this.fillWorkingAddresses(this.addresses)
  }

  /** Assigns the specified addresses to local properties, and sets inherited flags. */
  fillWorkingAddresses (addresses: RegRecAddressesIF): void {
    this.deliveryAddress = { ...addresses?.registeredOffice?.deliveryAddress }
    this.mailingAddress = { ...addresses?.registeredOffice?.mailingAddress }

    this.inheritDeliveryAddress =
      this.isSame(this.deliveryAddress, this.mailingAddress, ['addressType'])

    if (this.isBaseCompany) {
      this.recDeliveryAddress = { ...addresses?.recordsOffice?.deliveryAddress }
      this.recMailingAddress = { ...addresses?.recordsOffice?.mailingAddress }

      this.inheritRecDeliveryAddress =
        this.isSame(this.recDeliveryAddress, this.recMailingAddress, ['addressType'])

      this.inheritRegisteredAddress = (
        !this.isEmptyObject(this.deliveryAddress) && this.isSame(this.deliveryAddress, this.recDeliveryAddress) &&
        !this.isEmptyObject(this.mailingAddress) && this.isSame(this.mailingAddress, this.recMailingAddress)
      )
    }
  }

  /**
   * Event callback from BaseAddress to update the specified address.
   * @param baseAddress The base address that will be updated.
   * @param newAddress the object containing the new address.
   */
  updateBaseAddress (baseAddress: AddressIF, newAddress: AddressIF): void {
    // Note that we do a copy of the fields (rather than change the object reference)
    // to prevent an infinite loop with the property.
    Object.assign(baseAddress, newAddress)
  }

  /** Cancels the editing of addresses when user clicks Cancel button. */
  cancelEditAddresses (): void {
    // reset working addresses from draft
    this.fillWorkingAddresses(this.addresses)
    this.showAddressForm = false
  }

  /** Resets the working addresses when user clicks Reset button. */
  resetAddresses (): void {
    // reset working addresses from original and sync them with parent
    this.fillWorkingAddresses(this.original)
    this.emitWorkingAddresses()
    this.emitModified()
  }

  /**
   * Updates the address data using what was entered on the forms.
   * Called when user clicks Update Addresses button.
   */
  updateAddresses (): void {
    if (this.inheritDeliveryAddress) {
      // inherit the registered delivery address
      this.mailingAddress = { ...this.deliveryAddress, addressType: 'mailing' }
    }
    if (this.isBaseCompany) {
      if (this.inheritRecDeliveryAddress) {
        // inherit the records delivery address
        this.recMailingAddress = { ...this.recDeliveryAddress, addressType: 'mailing' }
      }
      if (this.inheritRegisteredAddress) {
        // inherit both registered addresses
        this.recDeliveryAddress = { ...this.deliveryAddress }
        this.recMailingAddress = { ...this.mailingAddress }
      }
    }

    this.showAddressForm = false
    // sync working addresses with parent
    this.emitWorkingAddresses()
    this.emitModified()
  }

  /** Adds an action, if it doesn't already exist. */
  addAction (address: AddressIF, val: string): void {
    if (address.actions.indexOf(val) < 0) address.actions.push(val)
  }

  /** Removes an action, if it already exists. */
  removeAction (address: AddressIF, val: string): void {
    address.actions = address.actions.filter(action => action !== val)
  }

  /** When form valid state changes, emit event up to parent. */
  @Watch('formValid')
  onFormValidChanged (): void {
    this.emitValid()
  }

  /** Emits the valid state of the addresses. */
  @Emit('valid')
  emitValid (): boolean {
    return this.formValid
  }

  /** Emits the modified state of the addresses. */
  @Emit('modified')
  emitModified (): boolean {
    return this.anyModified
  }

  /** Emits original addresses object to the parent page. */
  @Emit('original')
  emitOriginalAddresses (): RegRecAddressesIF {
    if (this.isBaseCompany) {
      return {
        registeredOffice: this.original.registeredOffice,
        recordsOffice: this.original.recordsOffice
      } as RegRecAddressesIF
    } else {
      return {
        registeredOffice: this.original.registeredOffice
      } as RegRecAddressesIF
    }
  }

  /** Emits updated addresses object to the parent page (ie, sync). */
  @Emit('update:addresses')
  emitWorkingAddresses (): RegRecAddressesIF {
    const deliveryAddress = { ...this.deliveryAddress } as AddressIF
    const mailingAddress = { ...this.mailingAddress } as AddressIF
    const recDeliveryAddress = { ...this.recDeliveryAddress } as AddressIF
    const recMailingAddress = { ...this.recMailingAddress } as AddressIF

    // safety check
    if (!isEmpty(deliveryAddress) && !isEmpty(mailingAddress)) {
      // update registered delivery action
      this.isSame(this.deliveryAddress, this.original?.registeredOffice?.deliveryAddress)
        ? this.removeAction(deliveryAddress, Actions.ADDRESSCHANGED)
        : this.addAction(deliveryAddress, Actions.ADDRESSCHANGED)

      // update registered mailing action
      this.isSame(this.mailingAddress, this.original?.registeredOffice?.mailingAddress)
        ? this.removeAction(mailingAddress, Actions.ADDRESSCHANGED)
        : this.addAction(mailingAddress, Actions.ADDRESSCHANGED)

      if (this.isBaseCompany) {
        // update records delivery action
        this.isSame(this.recDeliveryAddress, this.original?.recordsOffice?.deliveryAddress)
          ? this.removeAction(recDeliveryAddress, Actions.ADDRESSCHANGED)
          : this.addAction(recDeliveryAddress, Actions.ADDRESSCHANGED)

        // update records mailing action
        this.isSame(this.recMailingAddress, this.original?.recordsOffice?.mailingAddress)
          ? this.removeAction(recMailingAddress, Actions.ADDRESSCHANGED)
          : this.addAction(recMailingAddress, Actions.ADDRESSCHANGED)

        return {
          registeredOffice: { deliveryAddress, mailingAddress },
          recordsOffice: { deliveryAddress: recDeliveryAddress, mailingAddress: recMailingAddress }
        } as RegRecAddressesIF
      }

      return {
        registeredOffice: { deliveryAddress, mailingAddress }
      } as RegRecAddressesIF
    }

    // should never happen
    return null
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/theme.scss";

.address-list-container {
  padding: 1.25rem;
}

.v-btn {
  margin: 0;
  min-width: 6rem;
  text-transform: none;
}

.reset-btn {
  margin-top: 0.5rem;
}

.meta-container {
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

.meta-container__inner {
  margin-top: 1rem;
}

label:first-child {
  font-weight: 700;
  &__inner {
    flex: 1 1 auto;
  }
}

@media (min-width: 768px) {
  .meta-container {
    flex-flow: row nowrap;

    label:first-child {
      flex: 0 0 auto;
      width: 12rem;
    }
  }

  .meta-container__inner {
    flex: 1 1 auto;
    margin-top: 0;
  }
}

.address-list .form {
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .address-list .form {
    margin-top: 0;
  }
}

// Address Block Layout
.address-wrapper {
  margin-top: 0.5rem;
}

.address-block__actions {
  position: absolute;
  top: 0;
  right: 0;

  .v-btn {
    min-width: 4rem;
  }

  .v-btn + .v-btn {
    margin-left: 0.5rem;
  }
}

// Form Row Elements
.form__row + .form__row {
  margin-top: 0.25rem;
}

.form__btns {
  text-align: right;
  display: flex;
  justify-content: flex-end;
  padding: 1rem;

  .v-btn {
    margin: 0;

    + .v-btn {
      margin-left: 0.5rem;
    }
  }
}

.form__row.three-column {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  margin-right: -0.5rem;
  margin-left: -0.5rem;
}

.inherit-checkbox {
  margin-top: -3px;
  margin-left: -3px;
  padding: 0;
}
.records-inherit-checkbox {
  white-space: nowrap;
  margin-top: 0rem;
  margin-left: 4.65rem;
  margin-bottom: -1.5rem;
  padding: 0;

  .v-messages {
    display: none!important;
  }
}

// Registered Office Address Form Behavior
.show-address-form {
  li:first-child {
    padding-bottom: 0;
  }
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

// Editing Address Form
.address-edit-header {
  display: flex;
  background-color: rgba(1,51,102,0.15);
  padding: 1.25rem;

  address-edit-title {
    font-size: $px-16;
    font-weight: bold;
    line-height: 1.375rem;
  }
}
</style>
