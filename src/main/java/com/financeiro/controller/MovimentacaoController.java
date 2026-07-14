package com.financeiro.controller;

import com.financeiro.model.Movimentacao;
import com.financeiro.service.MovimentacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimentacoes")
@CrossOrigin("*")
public class MovimentacaoController {

    private final MovimentacaoService service;

    public MovimentacaoController(MovimentacaoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Movimentacao> listar(
            @RequestParam Long usuarioId) {

        return service.listarPorUsuario(usuarioId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movimentacao> buscar(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.buscarPorId(id)
        );
    }

    @PostMapping
    public ResponseEntity<Movimentacao> salvar(
            @Valid @RequestBody Movimentacao movimentacao) {

        return ResponseEntity.ok(
                service.salvar(movimentacao)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Movimentacao> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody Movimentacao movimentacao) {

        return ResponseEntity.ok(
                service.atualizar(id, movimentacao)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @PathVariable Long id) {

        service.deletar(id);

        return ResponseEntity.noContent().build();
    }
}