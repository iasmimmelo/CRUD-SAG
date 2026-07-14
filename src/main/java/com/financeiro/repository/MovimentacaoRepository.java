package com.financeiro.repository;

import com.financeiro.model.Movimentacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Long> {


    List<Movimentacao> findByUsuarioId(Long usuarioId);


}