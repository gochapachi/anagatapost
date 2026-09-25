import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { HandwritingFont } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const templates = await inMemoryStore.getTemplates(userId);
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "usr_demo",
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

    const saved = await inMemoryStore.saveTemplate({
      userId,
      title,
      description: description || null,
      category,
      content,
      handwritingFont: (handwritingFont as HandwritingFont) || "NONE",
      hasLetterhead: Boolean(hasLetterhead),
      letterheadTitle: letterheadTitle || null,
      isSystem: false,
    });

    inMemoryStore.logAudit("TEMPLATE_CREATED", `Created template "${title}"`, userId);

    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId") || "usr_demo";

    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const deleted = await inMemoryStore.deleteTemplate(id, userId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
