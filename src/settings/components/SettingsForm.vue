<template>
  <form class="settings__form">
    <div class="settings__row mdc-form-field">
      <label for="isDarkTheme" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">brightness_3</i>
        Dark theme
      </label>
      <m-switch id="isDarkTheme" v-model="settings.isDarkTheme"></m-switch>
    </div>
    <div class="settings__row mdc-form-field">
      <label for="popupWidth" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">border_horizontal</i>
        Popup width
      </label>
      <m-text-field id="popupWidth"
                    type="number"
                    class="settings__field"
                    suffix="px"
                    v-model="settings.popupWidth"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="tabHeight" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_line_spacing</i>
        Tab height
      </label>
      <m-text-field id="tabHeight"
                    type="number"
                    class="settings__field"
                    suffix="px"
                    v-model="settings.tabHeight"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="numberOfTabsToShow" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_list_numbered</i>
        Max number of tabs
      </label>
      <m-text-field id="numberOfTabsToShow"
                    type="number"
                    class="settings__field"
                    v-model="settings.numberOfTabsToShow"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="fontSize" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">format_size</i>
        Font size
      </label>
      <m-text-field id="fontSize"
                    type="number"
                    class="settings__field"
                    suffix="px"
                    v-model="settings.fontSize"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="iconSize" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">crop_original</i>
        Icon size
      </label>
      <m-text-field id="iconSize"
                    type="number"
                    class="settings__field"
                    suffix="px"
                    v-model="settings.iconSize"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="autoSwitchingTimeout" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">timelapse</i>
        Auto switching timeout
      </label>
      <m-text-field id="autoSwitchingTimeout"
                    type="number"
                    class="settings__field"
                    suffix="ms"
                    v-model="settings.autoSwitchingTimeout"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="textScrollDelay" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">timer</i>
        Text scroll delay
      </label>
      <m-text-field id="textScrollDelay"
                    type="number"
                    class="settings__field"
                    suffix="ms"
                    v-model="settings.textScrollDelay"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="textScrollCoefficient" class="settings__label">
        <i class="settings__icon settings__icon_label material-icons">text_rotation_none</i>
        Text scroll speed
      </label>
      <m-text-field id="textScrollCoefficient"
                    type="number"
                    class="settings__field"
                    v-model="settings.textScrollCoefficient"
                    :min="0"
      />
    </div>
    <div class="settings__row mdc-form-field">
      <label for="isSwitchingToPreviouslyUsedTab"
             class="settings__label"
             title="Switch to a previously used tab when a current one closes"
      >
        <i class="settings__icon settings__icon_label material-icons">low_priority</i>
        Switch to a previously used tab
      </label>
      <m-switch id="isSwitchingToPreviouslyUsedTab"
                v-model="settings.isSwitchingToPreviouslyUsedTab">
      </m-switch>
    </div>
    <div class="settings__row settings__row_buttons">
      <m-button id="setDefaults" @click="$emit('setDefaults')" type="button">
        <i slot="icon" class="settings__icon material-icons">restore</i>
        Set defaults
      </m-button>
    </div>
  </form>
</template>

<script>
  import MSwitch from './MSwitch.vue';
  import MTextField from './MTextField.vue';
  import MButton from './MButton.vue';

  export default {
    name: 'SettingsForm',
    props: {
      settings: {
        type: Object,
        required: true,
      },
    },
    components: {
      MSwitch,
      MTextField,
      MButton,
    },
  };
</script>

<style lang="scss">
  @import '~@material/form-field/mdc-form-field';
</style>
