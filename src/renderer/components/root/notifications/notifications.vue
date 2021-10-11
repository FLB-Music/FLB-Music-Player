<template>
  <div class="Notifications">
    <transition-group
      enter-active-class="animated fadeInDown extrafaster"
      leave-active-class="animated fadeOutUp extrafaster"
    >
      <base-notification
        v-for="notification in notifications"
        :key="notification.title"
        :notification="notification"
      />
    </transition-group>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { mapMutations } from 'vuex';

export default {
  name: 'Notifications',

  data() {
    return {
      progressNotificationSent: false
    };
  },
  computed: {
    notifications() {
      return this.$store.state.NotificationManager.notifications;
    }
  },
  methods: {
    ...mapMutations(['pushNotification', 'removeNotification'])
  },
  mounted() {
    ipcRenderer.on('notification', (e, notification) => {
      this.pushNotification(notification);
    });
    ipcRenderer.on('closeNotification', (e, title) => {
      this.removeNotification(title);
    });
  }
};
</script>

<style lang="scss">
.Notifications {
  position: fixed;
  z-index: 100;
  left: 50%;
  transform: translateX(-50%);
}
</style>
