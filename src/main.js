import Vue from 'vue'
import App from './App.vue'
import { MdButton, MdContent, MdTable, MdList, MdField, MdCheckbox, MdIcon, MdProgress } from 'vue-material/dist/components'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import VCalendar from 'v-calendar'

Vue.use(VCalendar)
Vue.use(MdButton)
Vue.use(MdContent)
Vue.use(MdTable)
Vue.use(MdList)
Vue.use(MdField)
Vue.use(MdCheckbox)
Vue.use(MdIcon)
Vue.use(MdProgress)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
