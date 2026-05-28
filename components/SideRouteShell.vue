<script setup lang="ts">
defineProps<{
  title: string
  columns: string[]
  emptyText: string
}>()
</script>

<template>
  <KiwifyChrome>
    <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20">
      <div class="page-header">
        <div class="flex items-center">
          <h3 class="page-title">{{ title }}</h3>
        </div>
      </div>
      <div class="mt-8 bg-white">
        <div class="w-full">
          <div class="flex flex-col">
            <div class="overflow-x-auto md:overflow-visible">
              <div class="align-middle inline-block min-w-full">
                <table class="kiwi-table min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th
                        v-for="column in columns"
                        :key="column"
                        class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {{ column }}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td :colspan="columns.length" class="p-10 text-gray-400 w-full text-center">
                        {{ emptyText }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="w-full"></div>
        </div>
      </div>
    </div>
  </KiwifyChrome>
</template>
