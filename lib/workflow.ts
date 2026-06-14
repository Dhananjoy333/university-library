import { Client as WorkflowClient } from "@upstash/workflow";
import config from "@/lib/config"; // Double-check this path matches your project structure
import emailjs from "@emailjs/nodejs";

export const workflowClient = new WorkflowClient({
    baseUrl: config.env.upstash.qstashUrl,
    token: config.env.upstash.qstashToken,
});

// Note: We removed the unused qstashClient instance since EmailJS handles its own requests

export const sendEmail = async ({
                                    email,
                                    subject,
                                    message,
                                }: {
    email: string;
    subject: string;
    message: string;
}) => {
    try {
        await emailjs.send(
            config.env.emailjs.serviceId,
            config.env.emailjs.templateId,
            {
                // These keys match the dynamic tags you set up in your EmailJS dashboard template
                to_email: email,
                email_subject: subject,
                email_message: message,
            },
            {
                publicKey: config.env.emailjs.publicKey,
                privateKey: config.env.emailjs.privateKey,
            }
        );
    } catch (error) {
        console.error("EmailJS failed to send email:", error);
        throw error;
    }
};