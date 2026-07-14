package com.financeiro.service;

import com.financeiro.model.Movimentacao;
import com.financeiro.model.Usuario;
import com.financeiro.repository.MovimentacaoRepository;
import com.financeiro.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class MovimentacaoService {

    private final MovimentacaoRepository repository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public MovimentacaoService(MovimentacaoRepository repository,
                               UsuarioRepository usuarioRepository) {
        this.repository = repository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Movimentacao> listarPorUsuario(Long usuarioId) {
        return repository.findByUsuarioId(usuarioId);
    }

    public Movimentacao buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Movimentação não encontrada"));
    }

    public Movimentacao salvar(Movimentacao movimentacao) {

        if (movimentacao.getUsuario() == null ||
                movimentacao.getUsuario().getId() == null) {

            throw new RuntimeException("Usuário não informado.");
        }

        Usuario usuario = usuarioRepository.findById(
                movimentacao.getUsuario().getId()
        ).orElseThrow(() ->
                new RuntimeException("Usuário não encontrado.")
        );

        movimentacao.setUsuario(usuario);

        return repository.save(movimentacao);
    }
    public Movimentacao atualizar(Long id, Movimentacao dados) {

        Movimentacao mov = buscarPorId(id);

        mov.setDescricao(dados.getDescricao());
        mov.setValor(dados.getValor());
        mov.setTipo(dados.getTipo());
        mov.setData(dados.getData());

        return repository.save(mov);
    }

    public void deletar(Long id) {

        if (!repository.existsById(id)) {
            throw new NoSuchElementException();
        }

        repository.deleteById(id);
    }
}