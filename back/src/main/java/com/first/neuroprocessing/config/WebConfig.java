package com.first.neuroprocessing.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**") // путь, который можно вызывать с фронта
                        .allowedOrigins("http://localhost:3000") // разрешаем фронту делать запросы
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // какие методы разрешены
                        .allowedHeaders("*") // можно присылать любые заголовки
                        .allowCredentials(true); // если будут куки
            }
        };
    }
}
