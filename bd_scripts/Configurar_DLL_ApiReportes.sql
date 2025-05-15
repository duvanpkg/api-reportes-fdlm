DROP PROCEDURE Api_ReportesJasper;
DROP ASSEMBLY Api_Jasper_SqlServer;

CREATE ASSEMBLY Api_Jasper_SqlServer FROM 'C:\DLLApireportes\Api_Reportes.dll' WITH PERMISSION_SET = UNSAFE;


CREATE PROCEDURE Api_ReportesJasper
	@Parametros [nvarchar](max),
	@ReporteYCarpeta [nvarchar](max)
WITH EXECUTE AS CALLER

AS EXTERNAL NAME Api_Jasper_SqlServer.Api_Reportes_LogicaSql.Api_ReportesJasper;
GO
--Ejecutar la siguiente linea si es necesario en produccion 
ALTER ASSEMBLY [System_Runtime_Serialization] FROM 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\System.Runtime.Serialization.dll'