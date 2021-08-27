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
        @click.native="sendFeedback('issue_report')"
        class="mb10"
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
        title: '',
        description: ''
      }
    };
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty']),
    async sendFeedback(type) {
      const data = {
        type,
        ...this.feedback
      };
      this.feedback.title = '';
      this.feedback.description = '';
      const req = await fetch('https://flbmusic-bot.herokuapp.com/api', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'FLB Music App'
        },
        body: JSON.stringify(data)
      });
      console.log(req);
    }
  },
  props: {
    feedbackType: String
  }
};
</script>

<style></style>
