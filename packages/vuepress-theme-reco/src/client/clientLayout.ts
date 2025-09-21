import { defineAsyncComponent } from 'vue'

export const customizeLayout = {
    'card-layout': defineAsyncComponent(() => import('./layouts/CardLayout.vue')),  
}