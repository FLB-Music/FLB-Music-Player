<template>
  <div
    :class="[
      `notification_${currentNotification.type}`,
      'notificationCard',
      'blurred_bg blur30'
    ]"
    @click="popNotification"
  >
    <div class="notification_body">
      <p class="notification_title">
        {{ currentNotification.title }}
      </p>
      <p
        v-if="currentNotification.subTitle"
        class="notification_subtitle"
      >
        {{ currentNotification.subTitle }}
      </p>
    </div>
    <base-icon
      class="closeNotification"
      icon="x"
    />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'BaseNotification',

  data() {
    return {
      currentNotification: this.notification
    };
  },
  methods: {
    ...mapMutations(['popNotification'])
  },
  mounted() {
    setTimeout(() => {
      if (!this.notification.isPersistent) {
        this.popNotification();
      }
    }, 3000);
  },
  props: {
    notification: Object
  }
};
</script>

<style lang="scss">
.notificationCard {
  border-radius: 10px;
  margin: 10px;
  max-width: 300px;
  cursor: pointer;
  display: flex;
  align-items: center;
  .notification_title {
    font-size: 0.8rem;
  }
  .notification_subtitle {
    font-size: 0.75rem;
    font-weight: 300;
  }
  .notification_body {
    padding: 10px;
  }
  .closeNotification {
    margin-right: 10px;
  }
  .closeNotification:hover {
    transform: scale(1.2);
  }
}
.notification_normal {
  border-bottom: 2px solid #0066ff;
  border-top: 2px solid #0066ff;
}
.notification_success {
  border-top: 2px solid #00ff91;
  border-bottom: 2px solid #00ff91;
}
.notification_danger {
  border-bottom: 2px solid crimson;
  border-top: 2px solid crimson;
}
.notification_warning {
  border-bottom: 2px solid orangered;
  border-top: 2px solid orangered;
}
</style>
