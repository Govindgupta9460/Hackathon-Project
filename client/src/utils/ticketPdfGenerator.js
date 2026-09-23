import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const generatePdfTicket = async ({ registration, event, user }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });

  const ticketId = registration.ticketId || `TKT-${registration._id}`;
  
  // Generate QR Code Data URL
  const qrDataUrl = await QRCode.toDataURL(ticketId, {
    width: 300,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 148, 210, 'F');

  // Decorative header bar
  doc.setFillColor(99, 102, 241); // indigo-600
  doc.rect(0, 0, 148, 32, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CAMPUS EVENT PASS', 74, 16, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Single-Use Entry Ticket', 74, 23, { align: 'center' });

  // Main Card Container Box
  doc.setDrawColor(51, 65, 85);
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(10, 38, 128, 158, 4, 4, 'FD');

  // Event Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  // Wrap title if long
  const titleLines = doc.splitTextToSize(event.title || 'Event Pass', 115);
  doc.text(titleLines, 74, 50, { align: 'center' });

  // Category Badge
  const badgeY = 50 + (titleLines.length * 5);
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(54, badgeY, 40, 6, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text((event.category || 'EVENT').toUpperCase(), 74, badgeY + 4.2, { align: 'center' });

  // Divider
  const divY = badgeY + 10;
  doc.setDrawColor(71, 85, 105);
  doc.line(18, divY, 130, divY);

  // Event & Attendee Info Grid
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184); // Slate muted

  const infoY = divY + 8;
  doc.text('DATE & TIME', 18, infoY);
  doc.text('VENUE', 80, infoY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
  doc.text(`${formattedDate}\n${event.time}`, 18, infoY + 5);
  doc.text(event.venue || 'Campus Venue', 80, infoY + 5);

  const userY = infoY + 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(148, 163, 184);
  doc.text('ATTENDEE NAME', 18, userY);
  doc.text('EMAIL / DEPT', 80, userY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const attendeeName = user?.name || registration.student?.name || 'Registered Student';
  const attendeeEmail = user?.email || registration.student?.email || '';
  const attendeeDept = user?.department || registration.student?.department || '';
  doc.text(attendeeName, 18, userY + 5);
  doc.text(`${attendeeEmail}\n${attendeeDept}`, 80, userY + 5);

  // QR Code Box Container
  const qrY = userY + 16;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(49, qrY, 50, 50, 2, 2, 'F');
  doc.addImage(qrDataUrl, 'PNG', 50, qrY + 1, 48, 48);

  // Ticket ID String
  const tktY = qrY + 56;
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(129, 140, 248);
  doc.text(ticketId, 74, tktY, { align: 'center' });

  // Notice Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Scan at door for single-time check-in. Non-transferable.', 74, tktY + 6, { align: 'center' });

  // Save PDF
  const safeFilename = (event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Ticket_${safeFilename}_${ticketId}.pdf`);
};
