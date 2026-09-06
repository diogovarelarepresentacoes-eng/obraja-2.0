import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: false,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP não configurado — emails desativados');
    }
  }

  private get from() {
    return this.config.get<string>('EMAIL_FROM') ?? 'noreply@obraja.com.br';
  }

  async sendApprovalEmail(to: string, companyName: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `ObraJá <${this.from}>`,
        to,
        subject: 'Seu cadastro foi aprovado! 🎉',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:28px;font-weight:700;color:#F05A28">ObraJá</span>
            </div>
            <h2 style="color:#1a1a1a;margin-bottom:8px">Parabéns, ${companyName}! ✅</h2>
            <p style="color:#555;line-height:1.6">
              Seu cadastro foi <strong>aprovado</strong> pela nossa equipe. Você já pode acessar
              o painel do fornecedor e começar a cadastrar seus produtos.
            </p>
            <a href="${this.config.get('SUPPLIER_URL') ?? 'https://fornecedor.obraja.com.br'}/login"
               style="display:inline-block;margin-top:24px;padding:14px 32px;background:#F05A28;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">
              Acessar o painel
            </a>
            <p style="margin-top:32px;color:#999;font-size:12px">
              ObraJá — Marketplace de materiais de construção
            </p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Falha ao enviar email de aprovação para ${to}`, err);
    }
  }

  async sendRejectionEmail(to: string, companyName: string, reason?: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `ObraJá <${this.from}>`,
        to,
        subject: 'Atualização sobre seu cadastro na ObraJá',
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:28px;font-weight:700;color:#F05A28">ObraJá</span>
            </div>
            <h2 style="color:#1a1a1a;margin-bottom:8px">Olá, ${companyName}</h2>
            <p style="color:#555;line-height:1.6">
              Após análise da nossa equipe, infelizmente não conseguimos aprovar seu cadastro
              no momento.
            </p>
            ${reason ? `
            <div style="background:#FFF8F6;border-left:4px solid #F05A28;padding:16px;margin:20px 0;border-radius:4px">
              <p style="color:#555;margin:0"><strong>Motivo:</strong> ${reason}</p>
            </div>` : ''}
            <p style="color:#555;line-height:1.6">
              Se acredita que houve um engano ou deseja reenviar a documentação,
              entre em contato pelo e-mail <a href="mailto:contato@obraja.com.br">contato@obraja.com.br</a>.
            </p>
            <p style="margin-top:32px;color:#999;font-size:12px">
              ObraJá — Marketplace de materiais de construção
            </p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Falha ao enviar email de rejeição para ${to}`, err);
    }
  }
}
