<template>
  <div class="min-h-screen flex bg-gray-100">
    <KSidebar />
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main tabindex="0" class="flex-1 relative z-0 focus:outline-none">
        <KTopbar />
        <slot />
      </main>
    </div>
  </div>
</template>
