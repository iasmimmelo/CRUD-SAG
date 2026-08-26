package com.financeiro.controller;


import com.financeiro.model.Usuario;
import com.financeiro.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin("*")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service){
        this.service = service;
    }


    @GetMapping
    public List<Usuario> listar(){

        return service.listar();

    }


    @PostMapping
    public Usuario criar(@RequestBody Usuario usuario){

        return service.salvar(usuario);

    }


    @PostMapping("/login")
    public ResponseEntity<Usuario> login(
            @RequestBody Usuario usuario){

        Usuario encontrado =
                service.buscarPorEmail(
                        usuario.getEmail());

        if(encontrado != null &&
                encontrado.getSenha()
                        .equals(usuario.getSenha())){

            return ResponseEntity.ok(encontrado);
        }

        return ResponseEntity
                .status(401)
                .build();
    }
}