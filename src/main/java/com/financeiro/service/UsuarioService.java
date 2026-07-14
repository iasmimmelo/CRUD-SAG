package com.financeiro.service;

import com.financeiro.model.Usuario;
import com.financeiro.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class UsuarioService {


    private final UsuarioRepository repository;


    public UsuarioService(UsuarioRepository repository){
        this.repository = repository;
    }



    public List<Usuario> listar(){
        return repository.findAll();
    }



    public Usuario salvar(Usuario usuario){

        if(repository.findByEmail(
                usuario.getEmail()).isPresent()){

            throw new RuntimeException(
                    "Email já cadastrado"
            );
        }

        return repository.save(usuario);
    }

    public Usuario buscarPorEmail(String email){

        return repository.findByEmail(email)
                .orElse(null);

    }

}