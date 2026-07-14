package com.financeiro;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Main implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }


    @Override
    public void run(String... args) throws Exception {

        System.out.println("--------------------------------------------");
        System.out.println(" SISTEMA DE CONTROLE FINANCEIRO INICIADO ");
        System.out.println("--------------------------------------------");
        System.out.println(" Acesse no navegador:");
        System.out.println(" http://localhost:8080");
        System.out.println("--------------------------------------------");

    }
}