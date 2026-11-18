import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { hashPassword } from "./auth";
import type { Database, Invoice, Property, Ticket, User } from "./types";

const DB_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "aluga-data")
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

const PLATFORM_FEE_RATE = 0.08; // 8% taxa de assessoria digital

function createDefaultUsers(): User[] {
  const defaultPasswordHash = hashPassword("123456");
  const now = "2026-02-01T10:00:00-03:00";
  return [
    {
      id: "usr-owner-1",
      name: "Ricardo Mendes",
      email: "ricardo@aluga.com",
      role: "proprietario",
      passwordHash: defaultPasswordHash,
      createdAt: now,
    },
    {
      id: "usr-tenant-1",
      name: "Camila Ferreira",
      email: "camila@aluga.com",
      role: "inquilino",
      passwordHash: defaultPasswordHash,
      createdAt: now,
    },
    {
      id: "usr-tenant-2",
      name: "Lucas Andrade",
      email: "lucas@aluga.com",
      role: "inquilino",
      passwordHash: defaultPasswordHash,
      createdAt: now,
    },
    {
      id: "usr-concierge-1",
      name: "Equipe Aluga",
      email: "assessoria@aluga.com",
      role: "assessoria",
      passwordHash: defaultPasswordHash,
      createdAt: now,
    },
  ];
}

function createSeedData(): Database {
  const users = createDefaultUsers();

  const properties: Property[] = [
    {
      id: "prop-1",
      title: "Apartamento Jardins — 2 Quartos",
      address: "Rua Oscar Freire, 1420, Apto 82 — São Paulo, SP",
      type: "Apartamento",
      rentAmount: 4200,
      condoFee: 890,
      iptuFee: 240,
      ownerName: "Ricardo Mendes",
      ownerEmail: "ricardo@aluga.com",
      ownerPixKey: "ricardo@aluga.com",
      autoApproveLimit: 500,
      tenantName: "Camila Ferreira",
      tenantEmail: "camila@aluga.com",
      tenantPhone: "(11) 98765-4321",
      contractStart: "2026-03-01",
      dueDay: 10,
      status: "Alugado",
      createdAt: "2026-02-20T10:00:00-03:00",
    },
    {
      id: "prop-2",
      title: "Studio Vila Madalena — Mobiliado",
      address: "Rua Aspicuelta, 512, Unidade 405 — São Paulo, SP",
      type: "Studio",
      rentAmount: 2950,
      condoFee: 540,
      iptuFee: 145,
      ownerName: "Ricardo Mendes",
      ownerEmail: "ricardo@aluga.com",
      ownerPixKey: "ricardo@aluga.com",
      autoApproveLimit: 400,
      tenantName: "Lucas Andrade",
      tenantEmail: "lucas@aluga.com",
      tenantPhone: "(11) 99123-8877",
      contractStart: "2026-06-01",
      dueDay: 15,
      status: "Alugado",
      createdAt: "2026-05-18T14:30:00-03:00",
    },
    {
      id: "prop-3",
      title: "Conjunto Comercial Brooklin",
      address: "Av. Eng. Luís Carlos Berrini, 1050, Sala 1104 — São Paulo, SP",
      type: "Comercial",
      rentAmount: 5800,
      condoFee: 1250,
      iptuFee: 420,
      ownerName: "Ricardo Mendes",
      ownerEmail: "ricardo@aluga.com",
      ownerPixKey: "ricardo@aluga.com",
      autoApproveLimit: 800,
      tenantName: null,
      tenantEmail: null,
      tenantPhone: null,
      contractStart: null,
      dueDay: 5,
      status: "Disponível",
      createdAt: "2026-10-12T09:15:00-03:00",
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv-1",
      code: "FAT-2026-1101",
      propertyId: "prop-1",
      referenceMonth: "Novembro/2026",
      dueDate: "2026-11-10",
      rentAmount: 4200,
      condoFee: 890,
      iptuFee: 240,
      extraCharges: 0,
      totalAmount: 5330,
      platformFee: 336,
      ownerNetAmount: 4994,
      status: "Pendente",
      pixCopyPaste:
        "00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-11015204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304A1B2",
      paidAt: null,
      transferredAt: null,
    },
    {
      id: "inv-5",
      code: "FAT-2026-1099",
      propertyId: "prop-1",
      referenceMonth: "Taxa Extra / Condomínio",
      dueDate: "2026-11-12",
      rentAmount: 4200,
      condoFee: 890,
      iptuFee: 240,
      extraCharges: 0,
      totalAmount: 5330,
      platformFee: 336,
      ownerNetAmount: 4994,
      status: "Pago",
      pixCopyPaste:
        "00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-10995204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304D9E1",
      paidAt: "2026-11-11T10:15:00-03:00",
      transferredAt: null,
    },
    {
      id: "inv-2",
      code: "FAT-2026-1102",
      propertyId: "prop-2",
      referenceMonth: "Novembro/2026",
      dueDate: "2026-11-20",
      rentAmount: 2950,
      condoFee: 540,
      iptuFee: 145,
      extraCharges: 0,
      totalAmount: 3635,
      platformFee: 236,
      ownerNetAmount: 3399,
      status: "Pendente",
      pixCopyPaste:
        "00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-11025204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304C3D4",
      paidAt: null,
      transferredAt: null,
    },
    {
      id: "inv-3",
      code: "FAT-2026-1001",
      propertyId: "prop-1",
      referenceMonth: "Outubro/2026",
      dueDate: "2026-10-10",
      rentAmount: 4200,
      condoFee: 890,
      iptuFee: 240,
      extraCharges: 0,
      totalAmount: 5330,
      platformFee: 336,
      ownerNetAmount: 4994,
      status: "Repassado",
      pixCopyPaste:
        "00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-10015204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304E5F6",
      paidAt: "2026-10-08T11:05:00-03:00",
      transferredAt: "2026-10-09T09:30:00-03:00",
    },
    {
      id: "inv-4",
      code: "FAT-2026-1002",
      propertyId: "prop-2",
      referenceMonth: "Outubro/2026",
      dueDate: "2026-10-15",
      rentAmount: 2950,
      condoFee: 540,
      iptuFee: 145,
      extraCharges: 0,
      totalAmount: 3635,
      platformFee: 236,
      ownerNetAmount: 3399,
      status: "Repassado",
      pixCopyPaste:
        "00020126580014br.gov.bcb.pix0136aluga-assessoria-fat-10025204000053039865802BR5913Aluga Digital6009SAO PAULO62070503***6304G7H8",
      paidAt: "2026-10-14T16:40:00-03:00",
      transferredAt: "2026-10-15T10:00:00-03:00",
    },
  ];

  const tickets: Ticket[] = [
    {
      id: "tkt-1",
      code: "CHM-1041",
      propertyId: "prop-1",
      category: "Manutenção",
      title: "Registro do chuveiro social com gotejamento",
      description:
        "Desde ontem o registro de pressão do banheiro social está pingando mesmo fechado. Gostaria de agendar um reparo.",
      priority: "Normal",
      status: "Em Análise",
      estimatedCost: 260,
      ownerApprovalRequired: false,
      ownerApproved: true,
      createdAt: "2026-11-14T09:20:00-03:00",
      updatedAt: "2026-11-15T11:10:00-03:00",
      messages: [
        {
          id: "msg-1",
          sender: "Inquilino",
          senderName: "Camila Ferreira",
          body: "Olá, o registro do banheiro social começou a pingar mesmo fechado. Poderiam verificar?",
          createdAt: "2026-11-14T09:20:00-03:00",
        },
        {
          id: "msg-2",
          sender: "Assessoria",
          senderName: "Equipe Aluga",
          body: "Olá, Camila! Já acionamos nosso encanador credenciado. O orçamento ficou em R$ 260,00 (dentro do limite pré-aprovado) e a visita está prevista para amanhã às 14h.",
          createdAt: "2026-11-15T11:10:00-03:00",
        },
      ],
    },
    {
      id: "tkt-2",
      code: "CHM-1042",
      propertyId: "prop-2",
      category: "Manutenção",
      title: "Troca do compressor do ar-condicionado",
      description:
        "O ar-condicionado split parou de gelar e o técnico credenciado identificou falha no compressor.",
      priority: "Urgente",
      status: "Aguardando Aprovação",
      estimatedCost: 980,
      ownerApprovalRequired: true,
      ownerApproved: null,
      createdAt: "2026-11-16T15:00:00-03:00",
      updatedAt: "2026-11-17T10:30:00-03:00",
      messages: [
        {
          id: "msg-3",
          sender: "Inquilino",
          senderName: "Lucas Andrade",
          body: "Pessoal, o ar-condicionado do studio parou de gelar completamente hoje à tarde.",
          createdAt: "2026-11-16T15:00:00-03:00",
        },
        {
          id: "msg-4",
          sender: "Assessoria",
          senderName: "Equipe Aluga",
          body: "Lucas, já realizamos a vistoria técnica. Como o reparo do compressor (R$ 980,00) supera o limite automático, enviamos para aprovação rápida do proprietário e retornamos em seguida.",
          createdAt: "2026-11-17T10:30:00-03:00",
        },
      ],
    },
    {
      id: "tkt-3",
      code: "CHM-1038",
      propertyId: "prop-1",
      category: "Financeiro",
      title: "Comprovante de pagamento de Outubro",
      description:
        "Solicito o recibo discriminado de aluguel e condomínio para reembolso corporativo.",
      priority: "Normal",
      status: "Resolvido",
      estimatedCost: null,
      ownerApprovalRequired: false,
      ownerApproved: null,
      createdAt: "2026-10-11T10:00:00-03:00",
      updatedAt: "2026-10-11T11:45:00-03:00",
      messages: [
        {
          id: "msg-5",
          sender: "Inquilino",
          senderName: "Camila Ferreira",
          body: "Preciso do recibo discriminado de outubro para enviar à empresa.",
          createdAt: "2026-10-11T10:00:00-03:00",
        },
        {
          id: "msg-6",
          sender: "Assessoria",
          senderName: "Equipe Aluga",
          body: "Recibo emitido e disponibilizado no seu portal financeiro. Qualquer dúvida, estamos à disposição.",
          createdAt: "2026-10-11T11:45:00-03:00",
        },
      ],
    },
    {
      id: "tkt-4",
      code: "CHM-1039",
      propertyId: "prop-2",
      category: "Contrato",
      title: "Autorização para instalação de rede de proteção",
      description:
        "Gostaria de confirmar se posso instalar rede de proteção transparente na janela do studio.",
      priority: "Normal",
      status: "Resolvido",
      estimatedCost: null,
      ownerApprovalRequired: false,
      ownerApproved: null,
      createdAt: "2026-10-20T14:00:00-03:00",
      updatedAt: "2026-10-20T16:10:00-03:00",
      messages: [
        {
          id: "msg-7",
          sender: "Inquilino",
          senderName: "Lucas Andrade",
          body: "Olá! Posso instalar rede de proteção na janela seguindo o padrão do condomínio?",
          createdAt: "2026-10-20T14:00:00-03:00",
        },
        {
          id: "msg-8",
          sender: "Assessoria",
          senderName: "Equipe Aluga",
          body: "Sim, Lucas! Já validamos com a convenção do condomínio e está autorizado na cor cristal/transparente.",
          createdAt: "2026-10-20T16:10:00-03:00",
        },
      ],
    },
  ];

  return { users, properties, invoices, tickets };
}

export async function readDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<Database>;

    let dirty = false;
    const users =
      Array.isArray(parsed.users) && parsed.users.length > 0
        ? parsed.users
        : ((dirty = true), createDefaultUsers());

    const properties = (parsed.properties ?? []).map((p) => {
      if (!p.ownerEmail) {
        dirty = true;
        return { ...p, ownerEmail: "ricardo@aluga.com" };
      }
      return p;
    });

    const normalized: Database = {
      users,
      properties,
      invoices: parsed.invoices ?? [],
      tickets: parsed.tickets ?? [],
    };

    if (dirty) {
      await writeDatabase(normalized).catch(() => {});
    }
    return normalized;
  } catch {
    const seed = createSeedData();
    await writeDatabase(seed).catch(() => {});
    return seed;
  }
}

export async function writeDatabase(db: Database): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

let dbWriteQueue: Promise<void> = Promise.resolve();

/** Serializes read-modify-write cycles to prevent concurrent API requests from overwriting each other. */
export async function updateDatabase<T>(
  mutator: (db: Database) => Promise<T> | T
): Promise<T> {
  let result!: T;
  const next = dbWriteQueue.then(async () => {
    const db = await readDatabase();
    result = await mutator(db);
    await writeDatabase(db);
  });
  dbWriteQueue = next.catch(() => {});
  await next;
  return result;
}

export function calculateInvoiceTotals(
  rentAmount: number,
  condoFee: number,
  iptuFee: number,
  extraCharges = 0
) {
  const totalAmount = Math.max(
    0,
    rentAmount + condoFee + iptuFee + extraCharges
  );
  const platformFee = Math.round(rentAmount * PLATFORM_FEE_RATE);
  const ownerNetAmount = Math.max(0, totalAmount - platformFee);
  return { totalAmount, platformFee, ownerNetAmount };
}
