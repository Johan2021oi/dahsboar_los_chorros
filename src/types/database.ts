export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          created_at: string
          nombre: string
          telefono: string | null
          direccion: string | null
          email: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          nombre: string
          telefono?: string | null
          direccion?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          nombre?: string
          telefono?: string | null
          direccion?: string | null
          email?: string | null
        }
      }
      ventas: {
        Row: {
          id: string
          created_at: string
          cliente_id: string
          total: number
          estado: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          cliente_id: string
          total: number
          estado?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          cliente_id?: string
          total?: number
          estado?: string | null
        }
      }
      detalle_venta: {
        Row: {
          id: string
          venta_id: string
          producto: string
          cantidad: number
        }
        Insert: {
          id?: string
          venta_id: string
          producto: string
          cantidad: number
        }
        Update: {
          id?: string
          venta_id?: string
          producto?: string
          cantidad?: number
        }
      }
      pagos: {
        Row: {
          id: string
          created_at: string
          cliente_id: string
          monto: number
          metodo_pago: string | null
          fecha: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          cliente_id: string
          monto: number
          metodo_pago?: string | null
          fecha?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          cliente_id?: string
          monto?: number
          metodo_pago?: string | null
          fecha?: string | null
        }
      }
    }
  }
}
