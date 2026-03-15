# 📱 Meta WhatsApp Business MCP Server

Servidor MCP para gestionar WhatsApp Business API de Meta desde Antigravity.

## Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `create_template` | Crear plantillas de mensaje |
| `list_templates` | Listar plantillas existentes |
| `get_template` | Ver detalles de una plantilla |
| `delete_template` | Eliminar una plantilla |
| `send_template_message` | Enviar mensaje con plantilla aprobada |
| `send_text_message` | Enviar texto libre (ventana 24h) |
| `check_config` | Verificar configuración del servidor |

## Requisitos

```bash
pip install fastmcp requests python-dotenv
```

## Configuración

1. Copia `.env.example` como `.env`:

```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales de Meta.

3. Agrega el server en tu configuración de Antigravity MCP:

```json
{
  "mcpServers": {
    "meta-whatsapp": {
      "command": "python3",
      "args": ["/Users/miguelperdomoserrato/sevet-pwa/mcp-servers/meta-whatsapp/server.py"]
    }
  }
}
```

## Prueba Manual

```bash
python3 server.py
```

## Credenciales Necesarias

- **META_ACCESS_TOKEN**: Token permanente del System User (Meta Business Suite)
- **WABA_ID**: ID de la cuenta de WhatsApp Business
- **PHONE_NUMBER_ID**: ID del número de teléfono registrado
