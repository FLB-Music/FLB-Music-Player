<template>
  <div class="feedback_widget widget blurred_bg blur20 max-h-80 bottom10">
    <div class="widget_header">
      <h1 class="widget_title">{{ t('feedback.title') }}</p>/h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showFeedbackWidget')"
      />
    </div>
    <div class="flex-col">
      <p v-if="feedbackType === 'issue'" class="mb10 weight300">
        {{ t('feedback.reportBug') }} 🐜
      </p>
      <p v-else class="mb10 weight300">{{ t('feedback.requestFeature') }}</p>
      <input
        v-model="feedback.title"
        :placeholder="t('feedback.titlePlaceholder')"
        type="text"
        class="inputElem mb10 min-w-90 pr10 max-w-90"
      />
      <textarea
        v-model="feedback.description"
        :placeholder="t('feedback.descriptionPlaceholder')"
        rows="5"
        type="text"
        class="inputElem mb10 min-w-90 pr10 max-w-90"
      />
      <base-button
        v-if="feedbackType === 'issue'"
        :block="true"
        :text="t('feedback.send')"
        class="mb10"
        @click.native="sendFeedback('issue_report')"
      />
      <base-button
        v-else
        :block="true"
        :text="t('feedback.send')"
        class="mb10"
        @click.native="sendFeedback('feature_request')"
      />
    </div>
  </div>
</template>

<script>
import { mapMutations } from "vuex";
export default {
  name: "FeedbackWidget",

  data() {
    return {
      feedback: {
        user: "unknown",
        title: "",
        description: "",
        state: "pending",
      },
    };
  },
  methods: {
    ...mapMutations(["UIcontrollerToggleProperty", "pushNotification"]),
    async sendFeedback() {
      this.feedback.user = localStorage.getItem("userID");
      this.UIcontrollerToggleProperty("showFeedbackWidget");
      this.pushNotification({
        title: this.t('feedback.sending'),
        subTitle: "",
        type: "normal",
      });
      const endPoint =
        this.feedbackType === "request" ? "feature-request" : "bug-report";

      const res = await fetch(
        `https://flb_worker.justpatrick.workers.dev/${endPoint}`,
        {
          body: JSON.stringify(this.feedback),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      );
      if (res.status === 200) {
        this.pushNotification({
          title:
            this.feedbackType === "request"
              ? this.t('feedback.requestSent')
              : this.t('feedback.bugReported'),
          subTitle: this.t('feedback.thanks'),
          type: "success",
        });
      } else {
        this.pushNotification({
          title:
            this.feedbackType === "request"
              ? this.t('feedback.requestFailed')
              : this.t('feedback.bugFailed'),
          subTitle: "",
          type: "danger",
        });
      }
      this.feedback.title = "";
      this.feedback.description = "";
    },
  },
  props: {
    feedbackType: String,
  },
};
</script>

<style></style>
