"use client";

import React from "react";
import { Video, ImageKitProvider } from "@imagekit/next";
import config from "@/lib/config";

interface BookVideoProps {
    videoUrl: string;
}

const BookVideo = ({ videoUrl }: BookVideoProps) => {
    return (
        <ImageKitProvider urlEndpoint={config.env.imagekit.urlEndpoint}>
            <Video
                src={videoUrl}
                controls={true}
                className="w-full rounded-xl"
            />
        </ImageKitProvider>
    );
};

export default BookVideo;