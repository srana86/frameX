declare module "nodemailer" {
  type SendMailOptions = Record<string, any>;
  type Transporter = {
    sendMail: (options: SendMailOptions) => Promise<{ messageId?: string }>;
  };

  const nodemailer: {
    createTransport: (config: Record<string, any>) => Transporter;
  };

  export = nodemailer;
  export default nodemailer;
}
