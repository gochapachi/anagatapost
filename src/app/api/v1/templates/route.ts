import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { HandwritingFont } from "@/lib/types";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    // The store unions system templates with the caller's own drafts, so the
    // caller id must come from the session, never from the query string.
    const templates = await store.getTemplates(auth.user.id);
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      title,
      description,
      category = "General",
      content,
      handwritingFont = "NONE",
      hasLetterhead = false,
      letterheadTitle,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Template title and content are required." },
        { status: 400 }
      );
    }

    const saved = await store.saveTemplate({
      // Ownership always comes from the session.
      userId: auth.user.id,
      title,
      description: description || null,
      category,
      content,
      handwritingFont: (handwritingFont as HandwritingFont) || "NONE",
      hasLetterhead: Boolean(hasLetterhead),
      letterheadTitle: letterheadTitle || null,
      isSystem: false,
    });

    await store.logAudit("TEMPLATE_CREATED", `Created template "${title}"`, auth.user.id);

    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = auth.user.id;

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const deleted = await store.deleteTemplate(id, userId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
