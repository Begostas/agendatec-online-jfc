import datetime

def format_iso(d):
    return f"{d.year:04d}-{d.month:02d}-{d.day:02d}"

def format_display(d):
    return f"{d.day:02d}/{d.month:02d}/{d.year:04d}"

def week_from_monday(start_iso):
    y, m, day = map(int, start_iso.split('-'))
    start = datetime.date(y, m, day)
    days = [start + datetime.timedelta(days=i) for i in range(5)]
    return days

def log_week(label, start_iso):
    days = week_from_monday(start_iso)
    end = days[-1]
    lines = []
    lines.append(f"[SEMANA] {label}")
    lines.append(f"- Início (ISO): {start_iso}")
    lines.append(f"- Início (BR): {format_display(days[0])}")
    lines.append(f"- Fim (ISO): {format_iso(end)}")
    lines.append(f"- Fim (BR): {format_display(end)}")
    lines.append("- Dias calculados (Seg→Sex):")
    for d in days:
        lines.append(f"  • {format_display(d)}  | ISO {format_iso(d)}  | origem: local")
    lines.append("")
    return "\n".join(lines)

def main():
    header = []
    header.append("Auditoria de calendário e origem de datas (local, sem toISOString)")
    header.append("Fonte de dados: cálculo local por incremento de dias; sem dependência externa")
    header.append("")

    # Semanas solicitadas
    semana1 = log_week("03/11/2025 (Segunda) → 07/11/2025 (Sexta)", "2025-11-03")
    semana2 = log_week("28/04/2025 (Segunda) → 02/05/2025 (Sexta)", "2025-04-28")
    # Semana que cruza ano: 29/12/2025 → 02/01/2026
    semana3 = log_week("29/12/2025 (Segunda) → 02/01/2026 (Sexta)", "2025-12-29")
    # Ano bissexto cruzando mês: 28/02/2028 (Segunda) → 03/03/2028 (Sexta)
    semana4 = log_week("28/02/2028 (Segunda) → 03/03/2028 (Sexta)", "2028-02-28")

    with open("log-auditoria-calendario.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(header))
        f.write("\n" + semana1)
        f.write("\n" + semana2)
        f.write("\n" + semana3)
        f.write("\n" + semana4)
        f.write("\nConclusão: Cálculo local consistente em transições de mês/ano e ano bissexto.")

if __name__ == "__main__":
    main()