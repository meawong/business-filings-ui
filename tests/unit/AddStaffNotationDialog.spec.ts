import Vue from 'vue'
import Vuetify from 'vuetify'
import flushPromises from 'flush-promises'
import sinon from 'sinon'
import { shallowMount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useBusinessStore, useConfigurationStore } from '@/stores'
import axios from '@/axios-auth'
import { AddStaffNotationDialog } from '@/components/dialogs'
import { CourtOrderPoa } from '@bcrs-shared-components/court-order-poa'
import FileUploadPdf from '@/components/common/FileUploadPdf.vue'

Vue.use(Vuetify)

const vuetify = new Vuetify({})
setActivePinia(createPinia())
const businessStore = useBusinessStore()
const configurationStore = useConfigurationStore()

// Prevent the warning "[Vuetify] Unable to locate target [data-app]"
document.body.setAttribute('data-app', 'true')

describe('AddStaffNotationDialog', () => {
  beforeAll(() => {
    // set configurations
    configurationStore.setConfiguration({
      'VUE_APP_LEGAL_API_URL': 'https://legal-api.url/',
      'VUE_APP_LEGAL_API_VERSION_2': 'v2'
    })
  })

  it('renders the page contents correctly for standard filing', () => {
    const wrapper = shallowMount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation',
          attach: '#parent-page'
        }
      })
    const vm: any = wrapper.vm

    expect(wrapper.find('#dialog-title').text()).toBe('Add a Test')
    expect(wrapper.findComponent(CourtOrderPoa).exists()).toBe(true)
    expect(wrapper.find('#dialog-save-button')).toBeDefined()
    expect(wrapper.find('#dialog-cancel-button')).toBeDefined()

    expect(vm.NOTATION_MAX_LENGTH).toBe(2000)
    expect(vm.MAX_FILE_SIZE).toBe(30)

    wrapper.destroy()
  })

  it('renders the page contents correctly for Administrative Dissolution', () => {
    const wrapper = shallowMount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Administrative Dissolution',
          name: 'dissolution',
          dissolutionType: 'administrative',
          attach: '#parent-page'
        }
      })
    const vm: any = wrapper.vm

    expect(wrapper.find('#dialog-title').text()).toBe('Administrative Dissolution')
    expect(wrapper.findComponent(CourtOrderPoa).exists()).toBe(true)
    expect(wrapper.find('#dialog-save-button')).toBeDefined()
    expect(wrapper.find('#dialog-cancel-button')).toBeDefined()

    expect(vm.NOTATION_MAX_LENGTH).toBe(2000)
    expect(vm.MAX_FILE_SIZE).toBe(30)

    wrapper.destroy()
  })

  it('renders the page contents correctly for Put Back On', () => {
    const wrapper = shallowMount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Put Back On',
          name: 'putBackOn',
          attach: '#parent-page'
        }
      })
    const vm: any = wrapper.vm

    expect(wrapper.find('#dialog-title').text()).toBe('Correction - Put Back On')
    expect(wrapper.findComponent(CourtOrderPoa).exists()).toBe(true)
    expect(wrapper.find('#dialog-save-button')).toBeDefined()
    expect(wrapper.find('#dialog-cancel-button')).toBeDefined()

    expect(vm.NOTATION_MAX_LENGTH).toBe(2000)
    expect(vm.MAX_FILE_SIZE).toBe(30)

    wrapper.destroy()
  })

  it('renders the page contents correctly for Admin Freeze/Unfreeze', () => {
    const wrapper = shallowMount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Freeze Business',
          name: 'adminFreeze',
          attach: '#parent-page'
        }
      })

    expect(wrapper.find('v-card-title-stub').text()).toBe('Freeze Business')
    expect(wrapper.find('v-card-text-stub').text()).toContain('You are about to freeze')
    expect(wrapper.find('v-card-text-stub').text()).toContain('This filing will not appear')
    expect(wrapper.find('#notation-form').exists()).toBe(false)
    expect(wrapper.find('.file-upload-pdf').exists()).toBe(false)
    expect(wrapper.findComponent(CourtOrderPoa).exists()).toBe(false)
    expect(wrapper.find('#dialog-save-button')).toBeDefined()
    expect(wrapper.find('#dialog-cancel-button')).toBeDefined()

    wrapper.destroy()
  })

  it('emits Close=false event when user clicks Cancel button', async () => {
    const wrapper = shallowMount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation'
        }
      })

    // click the Cancel button
    await wrapper.find('#dialog-cancel-button').trigger('click')

    // verify Close event
    expect(wrapper.emitted('close').pop()).toEqual([false])

    wrapper.destroy()
  })

  it('validates notation is not empty for Registrar\'s Notation', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          courtOrderNumberRequired: true,
          name: 'registrarsNotation'
        },
        vuetify
      })

    // Should not start with validation
    expect(wrapper.find('.notation-textarea').text()).not.toContain('Enter a Test')

    // Should validate after clicking on 'Save'
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('.notation-textarea').text()).toContain('Enter a Test')

    wrapper.destroy()
  })

  it('validates notation is not empty for Put Back On', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          courtOrderNumberRequired: true,
          name: 'putBackOn'
        },
        vuetify
      })

    // Should not start with validation
    expect(wrapper.find('.notation-textarea').text()).not.toContain('Enter a detailed comment')

    // Should validate after clicking on 'Save'
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('.notation-textarea').text()).toContain('Enter a detailed comment')

    wrapper.destroy()
  })

  it('validates notation is not empty for Administrative Dissolution', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          courtOrderNumberRequired: true,
          name: 'dissolution',
          dissolutionType: 'administrative'
        },
        vuetify
      })

    // Should not start with validation
    expect(wrapper.find('.notation-textarea').text()).not.toContain('Enter a detailed comment')

    // Should validate after clicking on 'Save'
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('.notation-textarea').text()).toContain('Enter a detailed comment')

    wrapper.destroy()
  })

  it('validates notation is not larger than allowed', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation',
          courtOrderNumberRequired: true
        },
        vuetify
      })

    // Valid data should be allowed
    await wrapper.find('.notation-textarea textarea').setValue('a'.repeat(2000))
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('.notation-textarea').text()).not.toContain('Maximum characters exceeded.')

    // Larger than allowed
    await wrapper.find('.notation-textarea textarea').setValue('a'.repeat(2001))
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('.notation-textarea').text()).toContain('Maximum characters exceeded.')

    wrapper.destroy()
  })

  it('validates court order number is required when plan of arrangement is checked', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation'
        },
        vuetify
      })

    // Enables validation
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    // Should not validate if plan of arrangement is not checked
    expect(wrapper.find('#court-order-poa').text()).not.toContain('A Court Order number is required')

    await wrapper.find('#plan-of-arrangement-checkbox').trigger('click')
    expect(wrapper.find('#court-order-poa').text()).toContain('A Court Order number is required')

    wrapper.destroy()
  })

  it('validates court order number is required when courtOrderNumberRequired is true', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation',
          courtOrderNumberRequired: true
        },
        vuetify
      })

    // Should not start with validation
    expect(wrapper.find('#court-order-poa').text()).not.toContain('A Court Order number is required')

    // Validates on 'Save'
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    expect(wrapper.find('#court-order-poa').text()).toContain('A Court Order number is required')

    wrapper.destroy()
  })

  it('validates court order number has correct min length', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation'
        },
        vuetify
      })

    // Less than allowed (min 5)
    wrapper.find('#court-order-number-input').setValue('a'.repeat(4))
    wrapper.find('#dialog-save-button').trigger('click')
    // for some reason, awaiting the 2 statements above doesn't work as expected
    await Vue.nextTick()

    expect(wrapper.find('#court-order-poa').text()).toContain('Court order number is invalid')

    // Allowed length (min 5)
    wrapper.find('#court-order-number-input').setValue('a'.repeat(5))
    wrapper.find('#dialog-save-button').trigger('click')
    // for some reason, awaiting the 2 statements above doesn't work as expected
    await Vue.nextTick()

    expect(wrapper.find('#court-order-poa').text()).not.toContain('Court order number is invalid')

    wrapper.destroy()
  })

  it('validates court order number has correct max length', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation'
        },
        vuetify
      })

    // Max length is valid (max 20)
    wrapper.find('#court-order-number-input').setValue('a'.repeat(20))
    wrapper.find('#dialog-save-button').trigger('click')
    // for some reason, awaiting the 2 statements above doesn't work as expected
    await Vue.nextTick()

    expect(wrapper.find('#court-order-poa').text()).not.toContain('Court order number is invalid')

    // Greater than allowed (max 20)
    wrapper.find('#court-order-number-input').setValue('a'.repeat(21))
    wrapper.find('#dialog-save-button').trigger('click')
    // for some reason, awaiting the 2 statements above doesn't work as expected
    await Vue.nextTick()

    expect(wrapper.find('#court-order-poa').text()).toContain('Court order number is invalid')

    wrapper.destroy()
  })

  it('validates court order or upload is required if none added', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Court Order',
          name: 'courtOrder'
        },
        vuetify
      })

    // Enables validation
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    const messages = wrapper.findAll('.error--text .v-messages__message')
    expect(messages.length).toBe(2)
    expect(messages.at(0).text()).toBe('Enter a Court Order and/or upload file')
    expect(messages.at(1).text()).toBe('Enter a Court Order and/or upload file')

    expect(wrapper.findComponent(FileUploadPdf).exists()).toBe(true)

    wrapper.destroy()
  })

  it('validates court order or upload is not required if either added', async () => {
    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Court Order',
          name: 'courtOrder'
        },
        vuetify
      })

    wrapper.find('.notation-textarea textarea').setValue('Court order 123456')
    await wrapper.find('#dialog-save-button').trigger('click')
    await Vue.nextTick()

    const messages = wrapper.findAll('.error--text .v-messages__message')
    expect(messages.length).toBe(0)

    wrapper.destroy()
  })

  it('saves notation filing when user clicks Save button', async () => {
    // init store
    businessStore.setIdentifier('BC0870669')

    sinon
      .stub(axios, 'post')
      .withArgs('https://legal-api.url/v2/businesses/BC0870669/filings')
      .returns(new Promise(resolve => resolve({ data: { filing: {} } })))

    const wrapper = mount(AddStaffNotationDialog,
      {
        propsData: {
          dialog: true,
          displayName: 'Test',
          name: 'registrarsNotation'
        },
        vuetify
      })

    wrapper.find('.notation-textarea textarea').setValue('Notation...')
    wrapper.find('#dialog-save-button').trigger('click')
    // for some reason, awaiting the 2 statements above doesn't work as expected
    await flushPromises() // need to wait longer here

    // verify Close event
    expect(wrapper.emitted('close').pop()).toEqual([true])

    wrapper.destroy()
  })
})
