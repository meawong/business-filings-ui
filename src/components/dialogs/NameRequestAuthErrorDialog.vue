<template>
  <v-dialog
    v-model="dialog"
    width="45rem"
    persistent
    :attach="attach"
    content-class="name-request-auth-error-dialog"
  >
    <v-card>
      <v-card-title>Unable to Access Incorporation Application</v-card-title>

      <v-card-text>
        <p class="font-15">
          Your account is currently unable to access this Incorporation Application.
          This may be because of the following:
        </p>

        <ul>
          <li>
            Your account is not authorized to access this Incorporation Application &mdash; contact
            the account owner to get access.
          </li>
          <li>Your login session has timed out &mdash; please exit and then login again.</li>
          <li>The specified URL is not valid &mdash; exit and return to the Business Registry page.</li>
        </ul>

        <p class="mt-4">
          You can retry now, or you can exit and try to access this Incorporation Application
          at another time.
        </p>

        <template v-if="!IsAuthorized(AuthorizedActions.NO_CONTACT_INFO)">
          <p class="font-15">
            If this error persists, please contact us.
          </p>
          <ContactInfo class="mt-5" />
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          id="dialog-exit-button"
          color="primary"
          text
          @click="exit()"
        >
          Exit
        </v-btn>
        <v-spacer />
        <v-btn
          id="dialog-retry-button"
          color="primary"
          text
          @click="retry()"
        >
          Retry
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Emit, Vue } from 'vue-property-decorator'
import { AuthorizedActions } from '@/enums'
import { ContactInfo } from '@/components/common'
import { IsAuthorized } from '@/utils'

@Component({
  components: { ContactInfo }
})
export default class NameRequestAuthErrorDialog extends Vue {
  // For Template Contact Info message
  readonly IsAuthorized = IsAuthorized
  readonly AuthorizedActions = AuthorizedActions

  /** Prop to display the dialog. */
  @Prop({ default: false }) readonly dialog!: boolean

  /** Prop to provide attachment selector. */
  @Prop({ default: '' }) readonly attach!: string

  // Pass click events to parent.
  @Emit() exit () {}
  @Emit() retry () {}
}
</script>
