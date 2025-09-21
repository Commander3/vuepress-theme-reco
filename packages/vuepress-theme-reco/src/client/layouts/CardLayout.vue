<template>
  <GenericContainer width-style="max-width">
    <Transition
      name="fade-slide-y"
      mode="out-in"
      @before-enter="onBeforeEnter"
      @before-leave="onBeforeLeave"
    >
      <main class="page-container">
        <div class="page-content">
          <PageInfo :key="page.path" :page-data="page" />
          <Content />
          <!-- 展示一个个子卡片 -->
          <Card v-for="(card, index) in cardData" :key="card.title ?? index">
            <CardHeader>
              <CardTitle class="text-card-foreground">
                {{ card.title ?? '' }}
                <sup v-if="card.deprecated ?? false"
                  >(deprecated)</sup
                ></CardTitle
              >
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  这是个包的描述
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </Transition>
    <!-- 
    <p class="text-lg">
              {{ card.title ?? '' }}
              <sup v-if="card.deprecated ?? false">(deprecated)</sup>
            </p> -->
  </GenericContainer>
</template>

<script setup lang="ts">
import { useThemeData } from '@composables/index.js'
import GenericContainer from '@components/GenericContainer/index.vue'
import { computed } from 'vue'
import { useScrollPromise, usePageData } from '@composables/index.js'
import { Card, CardHeader, CardTitle, CardContent } from '@client/components/Card'

const themeLocal = useThemeData()

const cardData = computed(() => {
  return themeLocal.value.stdInformation ?? []
})
const page = usePageData()
const scrollPromise = useScrollPromise()
const onBeforeEnter = scrollPromise.resolve
const onBeforeLeave = scrollPromise.pending
</script>
