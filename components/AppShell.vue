<template>
  <div class="min-h-screen flex bg-gray-100">
    <KSidebar />
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main tabindex="0" class="flex-1 relative z-0 focus:outline-none">
        <KTopbar />
        <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20 relative">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
