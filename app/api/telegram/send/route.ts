import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { chatIds, message } = await req.json();

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de Chat IDs inválida ou vazia.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensagem vazia.' },
        { status: 400 }
      );
    }

    let token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

    // Remove any accidental surrounding quotes (single or double) from the token
    if (token) {
      token = token.trim().replace(/^['"]|['"]$/g, '');
    }

    // If there is no real token, we will simulate a highly detailed response so that
    // the user doesn't get blocked in preview, but also alert them.
    if (!token || token.trim() === '' || token === 'undefined') {
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Modo de demonstração: Token do Telegram não configurado no .env. Mas a mensagem foi gerada e o envio simulado com sucesso!',
        contentSent: message,
      });
    }

    const results = [];
    for (const chatId of chatIds) {
      try {
        let response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });

        let data = await response.json();

        // Fallback: if Markdown parsing failed, retry sending as plain text (without parse_mode)
        if (!response.ok && data.description && (data.description.includes('parse') || data.description.includes('entity') || data.description.includes('entities'))) {
          const retryResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
          const retryData = await retryResponse.json();
          if (retryResponse.ok && retryData.ok) {
            response = retryResponse;
            data = retryData;
          }
        }

        if (response.ok && data.ok) {
          results.push({ chatId, success: true });
        } else {
          results.push({
            chatId,
            success: false,
            error: data.description || 'Erro desconhecido da API do Telegram.',
          });
        }
      } catch (err: any) {
        results.push({ chatId, success: false, error: err.message || 'Erro de conexão.' });
      }
    }

    const allSuccessful = results.every((r) => r.success);
    return NextResponse.json({
      success: allSuccessful,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
