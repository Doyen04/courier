declare module "nodemailer" {
  export interface Transporter {
    sendMail(message: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
    }): Promise<unknown>;
  }

  const nodemailer: {
    createTransport(options: {
      host: string;
      port: number;
      secure: boolean;
      auth?: { user: string; pass: string };
    }): Transporter;
  };

  export default nodemailer;
}
