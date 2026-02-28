package com.pisito.app.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
    properties = "spring.datasource.url=jdbc:h2:mem:pisitodb_http;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
)
@AutoConfigureMockMvc
@Transactional
class AuthControllerHttpIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginShouldReturnNotFoundWithMessageWhenUserDoesNotExist() throws Exception {
        String payload = """
            {
              "username": "missing_user",
              "password": "abc12345"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ese usuario no existe"));
    }

    @Test
    void loginShouldReturnUnauthorizedWithMessageWhenPasswordIsIncorrect() throws Exception {
        String registerPayload = """
            {
              "username": "login_http_user",
              "password": "abc12345"
            }
            """;

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerPayload))
            .andExpect(status().isCreated());

        String badLoginPayload = """
            {
              "username": "login_http_user",
              "password": "wrongpass1"
            }
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(badLoginPayload))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Contrasena incorrecta"));
    }
}
