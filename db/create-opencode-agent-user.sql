-- Usuario opencode de mínimo privilegio: Dani configura una instancia
-- (Agent Panels + Conversation Tags + Terms Gate) sin acceso a servidores.
--
-- DigitalOcean exige GRANT por base de datos: aplicar UNA VEZ POR TENANT.
-- Reemplazar <NIT_DB> (tenancy_db_name) y <PASSWORD>.
-- companies es CENTRAL: GRANT aparte sobre nojau_academy.
--
-- Uso:
--   sed -e 's/<NIT_DB>/nojau_27_tenant/' -e 's/<PASSWORD>/.../' \
--     scripts/db/create-opencode-agent-user.sql \
--     | mysql -h <host> -P 25060 -u root -p

CREATE USER IF NOT EXISTS 'opencode_agent'@'%' IDENTIFIED BY '<PASSWORD>';

-- Tags: sin DELETE físico (desactivar = UPDATE is_active = 0).
GRANT SELECT, INSERT, UPDATE
  ON `<NIT_DB>`.`conversation_tags`
  TO 'opencode_agent'@'%';

-- Paneles: las filas de type ya existen (seeder). No INSERT/DELETE de configs.
GRANT SELECT, UPDATE
  ON `<NIT_DB>`.`agent_configs`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_instructions`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_activation_cases`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_transfer_cases`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_faqs`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_button_rules`
  TO 'opencode_agent'@'%';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON `<NIT_DB>`.`agent_legal_terms`
  TO 'opencode_agent'@'%';

GRANT SELECT
  ON `<NIT_DB>`.`agent_tools`
  TO 'opencode_agent'@'%';

-- Central (una vez, no por tenant):
-- GRANT SELECT ON `nojau_academy`.`companies` TO 'opencode_agent'@'%';

FLUSH PRIVILEGES;
