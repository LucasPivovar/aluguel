export type UserRole = "proprietario" | "inquilino" | "assessoria";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

export type PropertyType = "Apartamento" | "Casa" | "Studio" | "Comercial";
export type PropertyStatus = "Alugado" | "Disponível" | "Em Vistoria";

export interface Property {
  id: string;
  title: string;
  address: string;
  type: PropertyType;
  rentAmount: number;
  condoFee: number;
  iptuFee: number;
  ownerName: string;
  ownerEmail: string;
  ownerPixKey: string;
  autoApproveLimit: number;
  tenantName: string | null;
  tenantEmail: string | null;
  tenantPhone: string | null;
  contractStart: string | null;
  dueDay: number;
  status: PropertyStatus;
  createdAt: string;
}

export type InvoiceStatus = "Pendente" | "Pago" | "Atrasado" | "Repassado";

export interface Invoice {
  id: string;
  code: string;
  propertyId: string;
  referenceMonth: string;
  dueDate: string;
  rentAmount: number;
  condoFee: number;
  iptuFee: number;
  extraCharges: number;
  totalAmount: number;
  platformFee: number;
  ownerNetAmount: number;
  status: InvoiceStatus;
  pixCopyPaste: string;
  paidAt: string | null;
  transferredAt: string | null;
}

export type TicketCategory = "Manutenção" | "Financeiro" | "Contrato" | "Dúvida";
export type TicketPriority = "Normal" | "Urgente";
export type TicketStatus =
  | "Aberto"
  | "Em Análise"
  | "Aguardando Aprovação"
  | "Resolvido";

export type MessageSender = "Inquilino" | "Assessoria" | "Proprietário";

export interface TicketMessage {
  id: string;
  sender: MessageSender;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string;
  propertyId: string;
  category: TicketCategory;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  estimatedCost: number | null;
  ownerApprovalRequired: boolean;
  ownerApproved: boolean | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface Database {
  users: User[];
  properties: Property[];
  invoices: Invoice[];
  tickets: Ticket[];
}
