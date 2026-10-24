# Migrations — estado real

Regra: listar esta pasta e usar o proximo numero livre. Toda mudanca de banco em producao = migration numerada, testada antes em staging, com backup validado e "pode" do Joaquim.

| Arquivo | Conteudo | Staging (cbgv...) | Producao (ustq...) |
|---|---|---|---|
| `20261022090000_baseline_smagnoto.sql` | Schema completo, RLS, grants, gatilhos | **NAO VERIFICADO** (staging tem dados: aplicada, ao que tudo indica) | **NAO VERIFICADO** |
| `20261023230000_hardening_auth_storage.sql` | Auditoria A4, A5, M1, B1 | **APLICADA em 24/10/2026** (backup validado 20261024-011628 antes; conferencia: 1 usuario, 1 empresa, 1 membro, handle_new_user sem super_admin automatico; login testado) | NAO APLICADA (banco vazio, sem baseline) |

Atualizar a tabela com a data e o backup que antecedeu cada aplicacao em producao.

## Super admin (depois da hardening)

Ninguem vira super_admin sozinho. Depois de criar o usuario no painel do Supabase (Authentication > Users > Add user, com "Auto Confirm"), rodar uma vez, como administrador do banco:

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'admin@smagnoto.com.br'
and not exists (select 1 from public.user_roles ur where ur.user_id = auth.users.id and ur.role = 'super_admin');
```

## Observacao sobre apagar usuarios

`company_user.user_id` e `user_roles.user_id` tem `on delete cascade` em `auth.users`. Apagar um usuario apaga seus vinculos; a empresa e os imoveis ficam sem dono. Antes de apagar o owner de uma empresa, vincular outro usuario como `owner` dela.
