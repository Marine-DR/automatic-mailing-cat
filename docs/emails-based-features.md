# Objectives
Reuse the service filter for each step. Emails will use the Recipient field and pattern matching on {{ column name }}

# Email for remembering the nuttering
Condition: valid line, Date Naissance after 5 months from today, "Ste fait" at NON or N/A, "Sapca Retour Perdu dcd" empty.
Action: 
- copy row to the page "Emails rappels ste". Add a column named "Email sent", always false at creation.
- Add a button to send emails from this page. 
- After each mail sent, pass the "Email sent" cell at true
- Template:
"""
    {{ M_Me }} {{ Prénom }} {{ Nom }},

    Nous vous rappelons que {{ Nom chat }} a plus de 5 mois, il est temps de prévoir sa stérilisation.

    Cordialement, 

    Cha'Mania

"""