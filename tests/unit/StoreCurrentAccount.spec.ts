import { createPinia, setActivePinia } from 'pinia'
import { getVuexStore } from '@/stores'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import Vuetify from 'vuetify'
import { IsAuthorized } from '@/utils'
import { AuthorizedActions } from '@/enums'

Vue.use(Vuetify)
const localVue = createLocalVue()
setActivePinia(createPinia())

describe('testing current account module', () => {
  const dummyAccount = (accountType: string) => {
    return {
      accountStatus: 'string',
      accountType: accountType,
      additionalLabel: 'string',
      id: 1234,
      label: 'string',
      productSettings: 'string',
      type: 'string',
      urlorigin: 'string',
      urlpath: 'string'
    }
  }

  it('fetches current account from session storage', async () => {
    vi.fn(() => async () => {
      const SbcHeader = require('sbc-common-components/src/components/SbcHeader.vue').default
      const store = await getVuexStore() as any // remove typings for unit tests
      shallowMount(SbcHeader, { store, localVue })

      store.commit('account/setCurrentAccount', dummyAccount(''), { root: true })
      expect((IsAuthorized(AuthorizedActions.SBC_BREADCRUMBS))).toBe(false)
    })
  })

  it('fetches current account from session storage - SBC_STAFF', async () => {
    vi.fn(() => async () => {
      const SbcHeader = require('sbc-common-components/src/components/SbcHeader.vue').default
      const store = await getVuexStore() as any // remove typings for unit tests
      shallowMount(SbcHeader, { store, localVue })

      store.commit('account/setCurrentAccount', dummyAccount('SBC_STAFF'), { root: true })
      expect((IsAuthorized(AuthorizedActions.SBC_BREADCRUMBS))).toBe(true)
    })
  })
})
