import { NextResponse } from "next/server";

export async function GET() {
  const mcpManifest = {
    schema_version: "v1",
    name_for_model: "anagata_post",
    name_for_human: "AnagataPost Physical Mail API",
    description_for_model:
      "Send real physical letters anywhere in India. AnagataPost prints on 100 GSM bond paper, seals in tamper-evident envelopes, and delivers via India Post Speed Post with tracking.",
    description_for_human: "Send real physical letters across India via API or AI agent.",
    tools: [
      {
        name: "send_physical_letter",
        description:
          "Send a physical paper letter to any address in India. Handles laser printing, postage, and Speed Post delivery.",
        parameters: {
          type: "object",
          properties: {
            recipient: {
              type: "string",
              description: "Name of the recipient or organization",
            },
            phone: {
              type: "string",
              description: "Optional 10-digit Indian mobile number for WhatsApp tracking alerts",
            },
            street: {
              type: "string",
              description: "Building, house number, and street name",
            },
            locality: {
              type: "string",
              description: "Colony, sector, or landmark",
            },
            city: {
              type: "string",
              description: "City or town name (e.g. Bengaluru, Mumbai, Delhi)",
            },
            state: {
              type: "string",
              description: "Indian state name (e.g. Karnataka, Maharashtra)",
            },
            pincode: {
              type: "string",
              description: "6-digit Indian Postal PIN code (e.g. 560034)",
            },
            content: {
              type: "string",
              description: "Letter body text. Line breaks will be preserved.",
            },
            delivery_type: {
              type: "string",
              enum: ["SPEED_POST", "REGISTERED_POST", "STANDARD"],
              default: "SPEED_POST",
              description: "Postal delivery speed tier",
            },
            handwriting: {
              type: "boolean",
              description: "Set to true to render in authentic cursive handwriting font",
            },
            send: {
              type: "boolean",
              default: true,
              description: "True sends immediately, false saves as draft",
            },
          },
          required: ["recipient", "street", "city", "state", "pincode", "content"],
        },
      },
      {
        name: "lookup_indian_pincode",
        description: "Validate a 6-digit Indian PIN code and retrieve city, district, state, and post office details.",
        parameters: {
          type: "object",
          properties: {
            pincode: {
              type: "string",
              description: "6-digit Indian PIN code",
            },
          },
          required: ["pincode"],
        },
      },
      {
        name: "track_letter",
        description: "Get real-time tracking status, Speed Post consignment number, and milestones for a sent letter.",
        parameters: {
          type: "object",
          properties: {
            letter_id: {
              type: "string",
              description: "The unique letter ID returned by send_physical_letter",
            },
          },
          required: ["letter_id"],
        },
      },
    ],
  };

  return NextResponse.json(mcpManifest);
}
