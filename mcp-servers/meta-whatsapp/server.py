#!/usr/bin/env python3
"""
Meta WhatsApp Business MCP Server para SEVET.
Permite crear, listar y gestionar plantillas de WhatsApp
y enviar mensajes desde Antigravity.

Requiere: pip install fastmcp requests python-dotenv
"""

import os
import json
import requests
from pathlib import Path
from fastmcp import FastMCP
from dotenv import load_dotenv

# Cargar variables de entorno desde .env en el mismo directorio
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Configuración
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
WABA_ID = os.getenv("WABA_ID", "")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID", "")
GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION", "v22.0")
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

mcp = FastMCP(
    "meta-whatsapp",
    instructions="Servidor MCP para gestionar WhatsApp Business API de Meta (plantillas y mensajes)"
)


def _headers():
    """Headers de autenticación para la Graph API."""
    return {
        "Authorization": f"Bearer {META_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }


def _check_config():
    """Verifica que las variables de entorno estén configuradas."""
    missing = []
    if not META_ACCESS_TOKEN:
        missing.append("META_ACCESS_TOKEN")
    if not WABA_ID:
        missing.append("WABA_ID")
    if not PHONE_NUMBER_ID:
        missing.append("PHONE_NUMBER_ID")
    if missing:
        return f"❌ Variables faltantes en .env: {', '.join(missing)}. Configura el archivo {env_path}"
    return None


# ──────────────────────────────────────────────
# HERRAMIENTAS DE PLANTILLAS
# ──────────────────────────────────────────────

@mcp.tool()
def create_template(
    name: str,
    body_text: str,
    language: str = "es_CL",
    category: str = "UTILITY",
    footer_text: str = "",
    header_text: str = "",
    example_values: list[str] | None = None,
    button_phone: str = "",
    button_phone_label: str = "",
    button_url: str = "",
    button_url_label: str = "",
) -> str:
    """
    Crea una plantilla de mensaje de WhatsApp Business en Meta.

    Args:
        name: Nombre de la plantilla (solo minúsculas, números y guiones bajos).
        body_text: Texto del cuerpo con variables {{1}}, {{2}}, etc.
        language: Código de idioma (default: es_CL).
        category: UTILITY, MARKETING o AUTHENTICATION.
        footer_text: Texto del pie de página (máximo 60 caracteres).
        header_text: Texto del encabezado (opcional).
        example_values: Valores de ejemplo para las variables del body.
        button_phone: Número de teléfono para botón de llamada.
        button_phone_label: Texto del botón de llamada.
        button_url: URL para botón de enlace.
        button_url_label: Texto del botón de URL.

    Returns:
        Resultado de la creación (ID de plantilla o error).
    """
    err = _check_config()
    if err:
        return err

    components = []

    # Header (opcional)
    if header_text:
        components.append({
            "type": "HEADER",
            "format": "TEXT",
            "text": header_text
        })

    # Body (obligatorio)
    body_component = {
        "type": "BODY",
        "text": body_text
    }
    if example_values:
        body_component["example"] = {"body_text": [example_values]}
    components.append(body_component)

    # Footer (opcional)
    if footer_text:
        components.append({
            "type": "FOOTER",
            "text": footer_text[:60]  # Máximo 60 caracteres
        })

    # Buttons (opcional)
    buttons = []
    if button_phone and button_phone_label:
        buttons.append({
            "type": "PHONE_NUMBER",
            "text": button_phone_label[:25],
            "phone_number": button_phone
        })
    if button_url and button_url_label:
        buttons.append({
            "type": "URL",
            "text": button_url_label[:25],
            "url": button_url
        })
    if buttons:
        components.append({
            "type": "BUTTONS",
            "buttons": buttons
        })

    payload = {
        "name": name,
        "language": language,
        "category": category,
        "components": components
    }

    url = f"{BASE_URL}/{WABA_ID}/message_templates"

    try:
        response = requests.post(url, headers=_headers(), json=payload, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if "id" in data:
            return f"✅ Plantilla '{name}' creada con éxito. ID: {data['id']}. Status: {data.get('status', 'PENDING')}"
        elif "error" in data:
            error = data["error"]
            return f"❌ Error al crear plantilla: {error.get('message', 'Unknown error')} (code: {error.get('code')})"
        else:
            return f"⚠️ Respuesta inesperada: {json.dumps(data, indent=2)}"
    except Exception as e:
        return f"❌ Error de conexión: {str(e)}"


@mcp.tool()
def list_templates(
    limit: int = 20,
    status: str = "",
) -> str:
    """
    Lista las plantillas de mensaje de WhatsApp Business existentes.

    Args:
        limit: Número máximo de plantillas a listar (default: 20).
        status: Filtrar por estado (APPROVED, PENDING, REJECTED, o vacío para todos).

    Returns:
        Lista de plantillas con nombre, estado, categoría e idioma.
    """
    err = _check_config()
    if err:
        return err

    params = {"limit": limit}
    if status:
        params["status"] = status

    url = f"{BASE_URL}/{WABA_ID}/message_templates"

    try:
        response = requests.get(url, headers=_headers(), params=params, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if "data" in data:
            templates = data["data"]
            if not templates:
                return "📋 No se encontraron plantillas."

            result = f"📋 **{len(templates)} plantillas encontradas:**\n\n"
            for t in templates:
                emoji = {"APPROVED": "✅", "PENDING": "⏳", "REJECTED": "❌"}.get(t.get("status", ""), "❓")
                result += f"- {emoji} **{t['name']}** | {t.get('status', 'N/A')} | {t.get('category', 'N/A')} | {t.get('language', 'N/A')} | ID: {t.get('id', 'N/A')}\n"

            return result
        elif "error" in data:
            return f"❌ Error: {data['error'].get('message', 'Unknown')}"
        else:
            return f"⚠️ Respuesta: {json.dumps(data, indent=2)}"
    except Exception as e:
        return f"❌ Error de conexión: {str(e)}"


@mcp.tool()
def get_template(template_name: str) -> str:
    """
    Obtiene los detalles completos de una plantilla específica.

    Args:
        template_name: Nombre exacto de la plantilla.

    Returns:
        Detalles completos de la plantilla incluyendo componentes y estado.
    """
    err = _check_config()
    if err:
        return err

    url = f"{BASE_URL}/{WABA_ID}/message_templates"
    params = {"name": template_name}

    try:
        response = requests.get(url, headers=_headers(), params=params, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if "data" in data and data["data"]:
            template = data["data"][0]
            result = f"📄 **Plantilla: {template['name']}**\n"
            result += f"- Estado: {template.get('status', 'N/A')}\n"
            result += f"- Categoría: {template.get('category', 'N/A')}\n"
            result += f"- Idioma: {template.get('language', 'N/A')}\n"
            result += f"- ID: {template.get('id', 'N/A')}\n\n"

            for comp in template.get("components", []):
                comp_type = comp.get("type", "UNKNOWN")
                if comp_type == "BODY":
                    result += f"**Cuerpo:** {comp.get('text', '')}\n"
                elif comp_type == "HEADER":
                    result += f"**Encabezado:** {comp.get('text', '')}\n"
                elif comp_type == "FOOTER":
                    result += f"**Pie:** {comp.get('text', '')}\n"
                elif comp_type == "BUTTONS":
                    result += "**Botones:**\n"
                    for btn in comp.get("buttons", []):
                        result += f"  - [{btn.get('type')}] {btn.get('text', '')}\n"

            return result
        elif "data" in data:
            return f"⚠️ No se encontró la plantilla '{template_name}'."
        else:
            return f"❌ Error: {data.get('error', {}).get('message', json.dumps(data))}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


@mcp.tool()
def delete_template(template_name: str) -> str:
    """
    Elimina una plantilla de mensaje de WhatsApp Business.

    Args:
        template_name: Nombre exacto de la plantilla a eliminar.

    Returns:
        Confirmación de eliminación o error.
    """
    err = _check_config()
    if err:
        return err

    url = f"{BASE_URL}/{WABA_ID}/message_templates"
    params = {"name": template_name}

    try:
        response = requests.delete(url, headers=_headers(), params=params, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if data.get("success"):
            return f"🗑️ Plantilla '{template_name}' eliminada correctamente."
        elif "error" in data:
            return f"❌ Error: {data['error'].get('message', 'Unknown')}"
        else:
            return f"⚠️ Respuesta: {json.dumps(data)}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


# ──────────────────────────────────────────────
# HERRAMIENTAS DE MENSAJERÍA
# ──────────────────────────────────────────────

@mcp.tool()
def send_template_message(
    to: str,
    template_name: str,
    language_code: str = "es_CL",
    body_parameters: list[str] | None = None,
) -> str:
    """
    Envía un mensaje de WhatsApp usando una plantilla aprobada.

    Args:
        to: Número de teléfono del destinatario (con código de país, sin +).
        template_name: Nombre de la plantilla aprobada.
        language_code: Código de idioma de la plantilla.
        body_parameters: Lista de valores para las variables del body (en orden).

    Returns:
        Resultado del envío (ID de mensaje o error).
    """
    err = _check_config()
    if err:
        return err

    template = {
        "name": template_name,
        "language": {"code": language_code}
    }

    # Agregar parámetros del body si fueron proporcionados
    if body_parameters:
        params = [{"type": "text", "text": p} for p in body_parameters]
        template["components"] = [
            {"type": "body", "parameters": params}
        ]

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": template
    }

    url = f"{BASE_URL}/{PHONE_NUMBER_ID}/messages"

    try:
        response = requests.post(url, headers=_headers(), json=payload, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if "messages" in data:
            msg_id = data["messages"][0].get("id", "N/A")
            return f"📱 Mensaje enviado exitosamente. ID: {msg_id}"
        elif "error" in data:
            error = data["error"]
            return f"❌ Error al enviar: {error.get('message', 'Unknown')} (code: {error.get('code')})"
        else:
            return f"⚠️ Respuesta: {json.dumps(data, indent=2)}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


@mcp.tool()
def send_text_message(
    to: str,
    message: str,
) -> str:
    """
    Envía un mensaje de texto libre de WhatsApp (solo funciona dentro de la ventana de 24h
    después de que el cliente envió un mensaje).

    Args:
        to: Número de teléfono del destinatario (con código de país, sin +).
        message: Texto del mensaje.

    Returns:
        Resultado del envío.
    """
    err = _check_config()
    if err:
        return err

    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message}
    }

    url = f"{BASE_URL}/{PHONE_NUMBER_ID}/messages"

    try:
        response = requests.post(url, headers=_headers(), json=payload, timeout=10)
        try:
            data = response.json()
        except ValueError:
            return f"❌ Error: Respuesta de la API no es JSON válido. Status {response.status_code}: {response.text[:100]}"

        if "messages" in data:
            msg_id = data["messages"][0].get("id", "N/A")
            return f"📱 Texto enviado. ID: {msg_id}"
        elif "error" in data:
            return f"❌ Error: {data['error'].get('message', 'Unknown')}"
        else:
            return f"⚠️ Respuesta: {json.dumps(data)}"
    except Exception as e:
        return f"❌ Error: {str(e)}"


@mcp.tool()
def check_config() -> str:
    """
    Verifica la configuración del servidor MCP y muestra los valores actuales.

    Returns:
        Estado de la configuración.
    """
    token_preview = f"{META_ACCESS_TOKEN[:10]}...{META_ACCESS_TOKEN[-5:]}" if len(META_ACCESS_TOKEN) > 15 else "(no configurado)"

    result = "🔧 **Configuración Meta WhatsApp MCP**\n\n"
    result += f"- **Token:** {token_preview}\n"
    result += f"- **WABA ID:** {WABA_ID or '(no configurado)'}\n"
    result += f"- **Phone Number ID:** {PHONE_NUMBER_ID or '(no configurado)'}\n"
    result += f"- **API Version:** {GRAPH_API_VERSION}\n"
    result += f"- **Base URL:** {BASE_URL}\n"
    result += f"- **.env Path:** {env_path}\n"

    err = _check_config()
    if err:
        result += f"\n{err}"
    else:
        result += "\n✅ Todas las variables configuradas correctamente."

    return result


if __name__ == "__main__":
    mcp.run()
