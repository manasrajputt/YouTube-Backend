import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: {
        url: String,
        public_id: String,
      }, // cloudinay url
      required: true,
    },
    thumbNail: {
      type: {
        url: String,
        public_id: String,
      }, // cloudinay url
      required: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // cloudinay url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);
// videoSchema.index({ title: "text", description: "text" });

export const Video = mongoose.model("Video", videoSchema);
