-- Add default configuration keys for Ticket Printing

INSERT INTO configuracion (clave, valor)
VALUES 
  ('ticket_ancho', '80mm'),
  ('ticket_mensaje_pie', '¡Gracias por su preferencia!')
ON CONFLICT (clave) DO NOTHING;
