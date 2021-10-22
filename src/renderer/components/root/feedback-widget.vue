<template>
  <div class="feedback_widget widget blurred_bg blur20 max-h-80 bottom10">
    <div class="widget_header">
      <h1 class="widget_title">Feedback</h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showFeedbackWidget')"
      />
    </div>
    <div class="flex-col">
      <p v-if="feedbackType === 'issue'" class="mb10 weight300">
        Report an Issue 🐜
      </p>
      <p v-else class="mb10 weight300">Request a Feature 💎</p>
      <input
        v-model="feedback.title"
        placeholder="Title"
        type="text"
        class="inputElem mb10 min-w-90 pr10 max-w-90"
      />
      <textarea
        v-model="feedback.description"
        placeholder="Description"
        rows="5"
        type="text"
        class="inputElem mb10 min-w-90 pr10 max-w-90"
      />
      <base-button
        v-if="feedbackType === 'issue'"
        :block="true"
        text="Send"
        class="mb10"
        @click.native="sendFeedback('issue_report')"
      />
      <base-button
        v-else
        :block="true"
        text="Send"
        class="mb10"
        @click.native="sendFeedback('feature_request')"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'FeedbackWidget',

  data() {
    return {
      feedback: {
        user: 'unknown',
        title: '',
        description: '',
        state: 'pending'
      }
    };
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty', 'pushNotification']),
    async sendFeedback() {
      this.feedback.user = localStorage.getItem('userID');
      this.UIcontrollerToggleProperty('showFeedbackWidget');
      this.pushNotification({
        title: 'Sending...',
        subTitle: '',
        type: 'normal'
      });
      const endPoint =
        this.feedbackType === 'request' ? 'feature-request' : 'bug-report';
      const res = await fetch(`https://flb-server.herokuapp.com/${endPoint}`, {
        body: JSON.stringify(this.feedback),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
      if (res.status === 200) {
        this.pushNotification({
          title:
            this.feedbackType === 'request'
              ? 'Feature Request Sent'
              : 'Bug Reported',
          subTitle: "Awesome keep 'em coming",
          type: 'success'
        });
      } else {
        this.pushNotification({
          title:
            this.feedbackType === 'request'
              ? 'Error sending Feature Request'
              : 'Error sending Bug Report',
          subTitle: '',
          type: 'danger'
        });
      }
      this.feedback.title = '';
      this.feedback.description = '';
    }
  },
  props: {
    feedbackType: String
  }
};
</script>

<style></style>
