package com.portfolio.optimizer.service;

import com.portfolio.optimizer.dto.FindUsernameResponse;
import com.portfolio.optimizer.dto.ResetPasswordResponse;
import com.portfolio.optimizer.model.PasswordResetToken;
import com.portfolio.optimizer.model.User;
import com.portfolio.optimizer.repository.PasswordResetTokenRepository;
import com.portfolio.optimizer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    /**
     * 이메일로 아이디 찾기
     */
    public FindUsernameResponse findUsername(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정을 찾을 수 없습니다."));

        // 아이디를 이메일로 발송
        try {
            emailService.sendUsernameEmail(email, user.getUsername());
            System.out.println("아이디 찾기 이메일 발송 완료: " + email);
        } catch (Exception e) {
            System.err.println("이메일 발송 실패: " + e.getMessage());
            // 이메일 발송 실패해도 응답은 반환 (사용자는 화면에서 확인 가능)
        }

        return FindUsernameResponse.builder()
                .username(user.getUsername())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * 비밀번호 재설정 토큰 생성 및 인증코드 발송
     */
    @Transactional
    public ResetPasswordResponse createResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("해당 이메일로 가입된 계정을 찾을 수 없습니다."));

        // 6자리 랜덤 인증코드 생성
        String verificationCode = generateVerificationCode();

        // 고유 토큰 생성
        String token = UUID.randomUUID().toString();

        // 토큰 저장 (15분 유효)
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .email(email)
                .verificationCode(verificationCode)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        tokenRepository.save(resetToken);

        // 이메일로 인증코드 발송
        try {
            emailService.sendPasswordResetEmail(email, verificationCode);
            System.out.println("=================================");
            System.out.println("비밀번호 재설정 인증코드 이메일 발송 완료");
            System.out.println("이메일: " + email);
            System.out.println("인증코드: " + verificationCode + " (백업용 콘솔 출력)");
            System.out.println("=================================");
        } catch (Exception e) {
            System.err.println("이메일 발송 실패, 콘솔로 대체: " + e.getMessage());
            System.out.println("=================================");
            System.out.println("비밀번호 재설정 인증코드: " + verificationCode);
            System.out.println("이메일: " + email);
            System.out.println("유효시간: 15분");
            System.out.println("=================================");
        }

        return ResetPasswordResponse.builder()
                .resetToken(token)
                .message("인증 코드가 이메일로 전송되었습니다.")
                .build();
    }

    /**
     * 인증코드 확인
     */
    public void verifyCode(String token, String verificationCode) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 토큰입니다."));

        if (resetToken.isUsed()) {
            throw new RuntimeException("이미 사용된 토큰입니다.");
        }

        if (resetToken.isExpired()) {
            throw new RuntimeException("토큰이 만료되었습니다. 다시 시도해 주세요.");
        }

        if (!resetToken.getVerificationCode().equals(verificationCode)) {
            throw new RuntimeException("인증 코드가 올바르지 않습니다.");
        }
    }

    /**
     * 비밀번호 재설정
     */
    @Transactional
    public void resetPassword(String token, String verificationCode, String newPassword) {
        // 인증코드 확인
        verifyCode(token, verificationCode);

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 토큰입니다."));

        // 사용자 찾기
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 비밀번호 암호화 및 저장
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 토큰 사용 처리
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        System.out.println("비밀번호가 성공적으로 변경되었습니다: " + user.getUsername());
    }

    /**
     * 6자리 랜덤 인증코드 생성
     */
    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
}
