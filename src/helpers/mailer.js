import { createTransport } from "nodemailer";

// Configura el cliente SMTP
const transporter = createTransport({
  host: "172.22.1.7",
  port: 2394,
  secure: false, // Dependiendo de la configuración de tu servidor SMTP
});

// Función para enviar un correo electrónico con asunto y cuerpo personalizados
export async function sendEmail(to, subject, text) {
  // Crea un objeto MailMessage
  const mailOptions = {
    from: "notificacion@fundaciondelamujer.com",
    to, // Reemplaza con la dirección de correo del destinatario
    subject,
    html: htmlTemplate(text), // Usamos el cuerpo personalizado
  };

  // Envía el correo electrónico
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error al enviar el correo electrónico:", error);
    } else {
      console.log("Correo electrónico enviado:", info.response);
    }
  });
}

export function htmlTemplate(contenido) {
  return `<html>
	<head>
		<meta charset="utf-8">
		<title>Notificación de API Reportes</title>
	</head>
	<body>
		<div style="margin-right: 30px;">
			<table style="width:100%;" border="0">
				<tbody>
					<tr>
						<td>
							<div style="padding-left: 15px; padding-right: 10px; padding-top: 5px; padding-bottom: 5px; border: 1px solid rgb(135,33,117); width: 100%;">
								<table cellspacing="0" style="width: 100%;">
									<tr>
										<td colspan="2" style="font-size: 13px; font-family: Arial;">
											<p>
												<img style="vertical-align: bottom;" src="https://movilizate.fundaciondelamujer.com:55698/css/img/bullet_tit.png" />
												<span style="color: rgb(135,33,117); font-weight: bold; font-size: 18px; font-family: Arial; margin-top: 10px;">Notificación de API Reportes</span>
											</p>
											<p style="font-style: italic;">${new Date().toDateString()}</p>
                                            ${contenido}
										</td>
									</tr>
									<tr>
										<td style="font-size: 13px; font-family: Arial;">
											<p><br/>Cordialmente,<br/><br/><br />
											</p>
										</td>
										<td style="text-align: left; font-size: 13px; font-family: Arial;">
											<a href="www.fundaciondelamujer.com">
												<img src="https://movilizate.fundaciondelamujer.com:55698/css/img/icon_mail.png" border="0" />
											</a>
										</td>
									</tr>
								</table>
							</div>
						</td>
					</tr>
					<td>
						<div style="padding-left: 15px; padding-right: 12px; background-color: rgb(135,33,117); color: #e5e5e5; vertical-align: middle; text-align: center; font-size: 12px; font-family: Arial; padding-top: 5px; padding-bottom: 5px; width: 100%;">
							Todos los derechos reservados Copyright © 2019-2020  &nbsp;&nbsp;&nbsp;&nbsp;| <a style="text-decoration: none; color: #e5e5e5; margin-left: 10px;" href="www.fundaciondelamujer.com">www.fundaciondelamujer.com</a>
						</div>
					</td>
				</tbody>
			</table>
		</div>
		<div><img src="https://ci5.googleusercontent.com/proxy/QhTUE-n07jeiQ9Zuy1hkd1kytMMjkwzcMGdhe1lmFnEzBXVShsDh94s2LuRxKeA0vQkuVmlSgPoyHZQavF4yOjRBq-YeXlAtXaSz3ag6rEi-cfAA93f-o6dZTeDt48NSppB41p5ccPpxt336u95yLZt2J=s0-d-e1-ft#https://sites.google.com/a/fundaciondelamujer.com/firma/_/rsrc/1477412940544/home/Awards.jpg" class="CToWUd"></div>
	</body>
</html>`;
}
