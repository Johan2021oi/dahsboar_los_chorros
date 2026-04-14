import jsPDF from 'jspdf';

export const generateReceipt = async (data: any, type: 'venta' | 'pago', branding: any) => {
  const margin = 5;
  const pageWidth = 80;
  
  // 1. FIRST PASS: Calculate required height
  let estimatedHeight = 10; // Top margin
  
  // Logo
  if (branding.logoImage) estimatedHeight += 22;
  
  // Business Info
  estimatedHeight += 6; // App Name
  if (branding.address) {
    const tempDoc = new jsPDF();
    const addrLines = tempDoc.splitTextToSize(branding.address, pageWidth - (margin * 2));
    estimatedHeight += addrLines.length * 4;
  }
  estimatedHeight += 5; // Contact details row
  estimatedHeight += 12; // Title and separator
  estimatedHeight += 12; // Transaction info (Fecha, No)
  estimatedHeight += 12; // Client info header and name
  
  if (data.clientes) {
    if (data.clientes.telefono) estimatedHeight += 4;
    if (data.clientes.email) estimatedHeight += 4;
    if (data.clientes.direccion) {
      const tempDoc = new jsPDF();
      const clientAddrLines = tempDoc.splitTextToSize(`Dir: ${data.clientes.direccion}`, pageWidth - (margin * 2));
      estimatedHeight += clientAddrLines.length * 4;
    }
  }
  estimatedHeight += 10; // Separator and table header
  
  if (type === 'venta') {
    if (data.detalle_venta && data.detalle_venta.length > 0) {
      data.detalle_venta.forEach((det: any) => {
        const tempDoc = new jsPDF();
        const price = Number(det.precio) || 0;
        const desc = `${det.producto} ($${price.toLocaleString()}/u)`;
        const descLines = tempDoc.splitTextToSize(desc, pageWidth - margin - (margin + 12) - 15);
        estimatedHeight += (descLines.length * 4) + 1;
      });
    } else {
      estimatedHeight += 5;
    }
  } else {
    estimatedHeight += 16; // Concepto row
  }
  
  estimatedHeight += 27; // Footer (Total + Thank you + App Name)
  estimatedHeight += 10; // Bottom margin
  
  // 2. SECOND PASS: Generate PDF with dynamic height
  const doc = new jsPDF({
    unit: 'mm',
    format: [pageWidth, Math.max(100, estimatedHeight)] // Min height of 100mm
  });

  let y = 10;

  // Header and Logo
  if (branding.logoImage) {
    try {
      // Pass undefined for format to allow auto-detection from Data URL
      doc.addImage(branding.logoImage, undefined, 30, y, 20, 20, undefined, 'FAST');
      y += 22;
    } catch (e) {
      console.error('Pdf image error:', e);
      // No fallback text, just skip
    }
  }

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(branding.appName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Business Contact Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  if (branding.address) {
    const addrLines = doc.splitTextToSize(branding.address, pageWidth - (margin * 2));
    addrLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 4;
    });
  }

  const contactDetails = [];
  if (branding.phone) contactDetails.push(`Tel: ${branding.phone}`);
  if (branding.phone2) contactDetails.push(branding.phone2);
  if (branding.email) contactDetails.push(branding.email);
  
  if (contactDetails.length > 0) {
    doc.text(contactDetails.join(' | '), pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(type === 'venta' ? 'COMPROBANTE DE VENTA' : 'COMPROBANTE DE PAGO', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Transaction Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha: ${new Date(data.created_at || Date.now()).toLocaleString()}`, margin, y);
  y += 4;
  doc.text(`No: ${data.id?.substring(0, 8).toUpperCase()}`, margin, y);
  y += 8;

  // Client Info
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.clientes?.nombre || 'Consumidor Final'}`, margin, y);
  y += 4;

  if (data.clientes) {
    if (data.clientes.telefono) {
      doc.text(`Tel: ${data.clientes.telefono}`, margin, y);
      y += 4;
    }
    if (data.clientes.email) {
      doc.text(`Email: ${data.clientes.email}`, margin, y);
      y += 4;
    }
    if (data.clientes.direccion) {
      const clientAddrLines = doc.splitTextToSize(`Dir: ${data.clientes.direccion}`, pageWidth - (margin * 2));
      clientAddrLines.forEach((line: string) => {
        doc.text(line, margin, y);
        y += 4;
      });
    }
  }

  y += 4;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Table Details
  if (type === 'venta') {
    doc.setFont('helvetica', 'bold');
    doc.text('CANT', margin, y);
    doc.text('DESCRIPCIÓN', margin + 12, y);
    doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    if (data.detalle_venta && data.detalle_venta.length > 0) {
      data.detalle_venta.forEach((det: any) => {
        let price = Number(det.precio) || 0;
        if (price === 0 && data.detalle_venta.length === 1) {
          price = (Number(data.total) || 0) / (Number(det.cantidad) || 1);
        }
        
        const subtotal = (Number(det.cantidad) || 0) * price;
        const desc = `${det.producto} ($${price.toLocaleString()}/u)`;
        const descLines = doc.splitTextToSize(desc, pageWidth - margin - (margin + 12) - 15);
        
        doc.text(det.cantidad.toString(), margin, y);
        
        descLines.forEach((line: string, i: number) => {
          doc.text(line, margin + 12, y);
          if (i === 0) {
            doc.text(`$${subtotal.toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
          }
          y += 4;
        });
        y += 1;
      });
    } else {
      doc.text('Productos varios', margin + 12, y);
      doc.text(`$${(Number(data.total) || 0).toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
      y += 5;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text('CONCEPTO:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('Abono a cuenta / Pago de productos', margin, y);
    y += 4;
    if (data.metodo_pago) {
      doc.text(`Método: ${data.metodo_pago}`, margin, y);
      y += 4;
    }
    y += 4;
  }

  y += 4;
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'pago' ? 'PAGO / ABONO:' : 'TOTAL A PAGAR:', margin, y);
  const finalTotal = type === 'venta' ? data.total : data.monto;
  doc.text(`$${(Number(finalTotal) || 0).toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('¡Gracias por preferirnos!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(branding.appName.toUpperCase(), pageWidth / 2, y, { align: 'center' });

  // Save PDF
  const clientName = data.clientes?.nombre || 'Consumidor_Final';
  const cleanName = clientName.replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
  doc.save(`${type.toUpperCase()}_${cleanName}.pdf`);
};
