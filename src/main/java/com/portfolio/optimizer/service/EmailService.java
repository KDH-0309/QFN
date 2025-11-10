package com.portfolio.optimizer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    /**
     * 간단한 텍스트 이메일 발송
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            System.out.println("이메일 발송 성공: " + to);
        } catch (Exception e) {
            System.err.println("이메일 발송 실패: " + e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다.", e);
        }
    }

    /**
     * HTML 이메일 발송
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            System.out.println("HTML 이메일 발송 성공: " + to);
        } catch (Exception e) {
            System.err.println("HTML 이메일 발송 실패: " + e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다.", e);
        }
    }

    /**
     * 아이디 찾기 결과 이메일 발송
     */
    public void sendUsernameEmail(String to, String username) {
        String subject = "[Stock Portfolio Optimizer] 아이디 찾기 결과";
        String htmlContent = buildUsernameEmailTemplate(username);
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * 비밀번호 재설정 인증코드 이메일 발송
     */
    public void sendPasswordResetEmail(String to, String verificationCode) {
        String subject = "[Stock Portfolio Optimizer] 비밀번호 재설정 인증코드";
        String htmlContent = buildPasswordResetEmailTemplate(verificationCode);
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * 아이디 찾기 이메일 템플릿
     */
    private String buildUsernameEmailTemplate(String username) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .username-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px solid #667eea; }
                    .username { font-size: 24px; font-weight: bold; color: #667eea; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>아이디 찾기</h1>
                    </div>
                    <div class="content">
                        <p>안녕하세요,</p>
                        <p>요청하신 아이디 찾기 결과입니다.</p>
                        
                        <div class="username-box">
                            <p style="margin: 0; color: #666;">회원님의 아이디는</p>
                            <p class="username">%s</p>
                        </div>
                        
                        <p>로그인 페이지에서 해당 아이디로 로그인하실 수 있습니다.</p>
                        <p>비밀번호를 잊으셨다면 비밀번호 찾기 기능을 이용해 주세요.</p>
                        
                        <div class="footer">
                            <p>본 메일은 발신 전용입니다.</p>
                            <p>&copy; 2025 Stock Portfolio Optimizer. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, username);
    }

    /**
     * 비밀번호 재설정 이메일 템플릿
     */
    private String buildPasswordResetEmailTemplate(String verificationCode) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .code-box { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px solid #667eea; }
                    .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>비밀번호 재설정</h1>
                    </div>
                    <div class="content">
                        <p>안녕하세요,</p>
                        <p>비밀번호 재설정을 위한 인증코드입니다.</p>
                        
                        <div class="code-box">
                            <p style="margin: 0 0 10px 0; color: #666;">인증 코드</p>
                            <p class="code">%s</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ 주의사항</strong>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                                <li>인증코드는 <strong>15분간 유효</strong>합니다.</li>
                                <li>본인이 요청하지 않은 경우, 즉시 비밀번호를 변경해 주세요.</li>
                                <li>인증코드는 타인에게 절대 공유하지 마세요.</li>
                            </ul>
                        </div>
                        
                        <p>비밀번호 재설정 페이지로 돌아가서 위 코드를 입력해 주세요.</p>
                        
                        <div class="footer">
                            <p>본 메일은 발신 전용입니다.</p>
                            <p>&copy; 2025 Stock Portfolio Optimizer. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, verificationCode);
    }
}
