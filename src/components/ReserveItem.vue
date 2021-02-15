<template>
    <div style="width: 400px; margin: 0 auto">
    <md-list-item>
        {{ time.time }}
            <md-button v-on:click="$emit('send')" class="md-dense md-primary" v-if="!reserved">Reserve</md-button>
                    <span v-if="reserved">
        <md-button class="md-dense md-primary" v-if="reserved.reservableId != time.reservableId" disabled>Reserve</md-button>
        <md-button v-on:click="$emit('cancel', reserved.id)" class="md-dense md-accent" v-if="reserved.reservableId == time.reservableId">Cancel</md-button>
          </span>
            Reservations {{ time.reservations }} / {{ time.entries }}
    </md-list-item>
    </div>
</template>

<script>

export default {
    name: 'ReserveItem',
    props: ['time', 'reserved']
}
</script>

<style lang="scss" scoped>

@import "~vue-material/dist/theme/engine";

 @include md-register-theme("default", (
  primary: green, // The primary color of your application
  accent: md-get-palette-color(red, A200), // The accent or secondary color
));

.md-primary {
    @include md-theme-component() {
        @include md-theme-property(color, text-primary, background);
        background: #c0ffc0;
    }
}
.md-accent {
    @include md-theme-component() {
        @include md-theme-property(color, text-primary, background);
        background: #ffc0c0;
    }
}


@import "~vue-material/dist/components/MdButton/theme";
</style>
