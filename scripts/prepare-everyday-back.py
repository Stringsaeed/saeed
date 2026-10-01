"""Typeset the user-supplied back cover as editable vector artwork.
Requires reportlab from the workspace Python runtime.
The reference photograph is retained separately; no photographed pixels are used.
"""
from pathlib import Path
from html import escape
import xml.etree.ElementTree as ET
from reportlab.graphics.barcode.eanbc import Ean13BarcodeWidget, Ean5BarcodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderSVG

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/books-3d/the-design-of-everyday-things/back-vector.svg'
YELLOW='#ffe439'; DARK='#1d211b'; RUST='#ad4c2b'; CREAM='#f4f0d9'; MUTED='#c9c8b1'
parts=[f'<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="1370" height="2100" viewBox="0 0 1370 2100"><title>The Design of Everyday Things — reconstructed back cover</title><desc>Editable recreation from a user-supplied reference. Text, panels and ISBN barcode are vector elements.</desc><rect width="1370" height="2100" fill="{YELLOW}"/>']

def txt(text,x,y,size=29,color=DARK,font='serif',anchor='start',spacing=None,italic=False):
 family="Arial, sans-serif" if font=='sans' else "'Times New Roman', Times, serif"
 extra=(f' letter-spacing="{spacing}"' if spacing is not None else '')+(' font-style="italic"' if italic else '')
 parts.append(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{color}" text-anchor="{anchor}"{extra}>{escape(text)}</text>')

def rich_line(runs,x,y,size=29,color=DARK,anchor='start'):
 spans=''.join(f'<tspan'+(' font-style="italic"' if italic else '')+'>'+escape(text)+'</tspan>' for text,italic in runs)
 parts.append(f'<text x="{x}" y="{y}" font-family="\'Times New Roman\', Times, serif" font-size="{size}" fill="{color}" text-anchor="{anchor}">{spans}</text>')

def panel(y,height):parts.append(f'<rect y="{y}" width="1370" height="{height}" fill="{DARK}"/>')

def barcode(widget,x,y,width,height):
 bounds=widget.getBounds();w=bounds[2]-bounds[0];h=bounds[3]-bounds[1]
 drawing=Drawing(w,h);drawing.add(widget)
 raw=renderSVG.drawToString(drawing)
 node=ET.fromstring(raw)
 node.set('x',str(x));node.set('y',str(y));node.set('width',str(width));node.set('height',str(height));node.set('viewBox',f'0 0 {w} {h}');node.set('preserveAspectRatio','none')
 parts.append(ET.tostring(node,encoding='unicode'))

txt('BUSINESS / PSYCHOLOGY',31,88,29,RUST,'sans',spacing=2)
panel(128,174)
txt('“Part operating manual for designers and part manifesto on the power of designing for people.',685,179,30,CREAM,anchor='middle')
rich_line([('The Design of Everyday Things',True),(' is even more relevant today than it was when first published.”',False)],685,227,30,CREAM,'middle')
rich_line([('—TIM BROWN, CEO, IDEO, and author of ',False),('Change by Design',True)],685,276,29,MUTED,'middle')
# The original has a drop capital spanning its first two lines.
parts.append(f'<text x="0" y="464" transform="translate(24 0) scale(.68 1)" font-family="Arial, sans-serif" font-size="171" fill="{RUST}">E</text>')
body=[
 ([("ven the smartest among us can feel inept as we try to figure out the shower control in a hotel or",False)],115),
 ([("attempt to navigate an unfamiliar television set or stove. When ",False),("The Design of Everyday Things",True)],115),
 ([("was published in 1988, Don Norman proposed that the fault lies not in ourselves but in product de-",False)],115),
 ([("sign that ignores the needs of users and the principles of cognitive psychology. Alas, bad design",False)],34),
 ([("is everywhere, but fortunately, it isn’t difficult to design things that are understandable, usable, and",False)],34),
 ([("enjoyable. Thoughtfully revised to keep the timeless principles of psychology up to date with ever-",False)],34),
 ([("changing new technologies, ",False),("The Design of Everyday Things",True),(" is a powerful appeal for good design, and",False)],34),
 ([("a reminder of how—and why—some products satisfy customers while others only frustrate them.",False)],34),
]
for i,(runs,x) in enumerate(body):rich_line(runs,x,365+i*49,29)
panel(760,754)
txt('“Design may be our top competitive edge. This book is a joy—fun and of the utmost importance.”',685,840,29,CREAM,anchor='middle')
rich_line([('—TOM PETERS, author of ',False),('In Search of Excellence',True)],685,888,29,MUTED,'middle')
parts.append('<path d="M425 918H945" stroke="#c5a441" stroke-width="2"/>')
for y,line in [(968,'“This book changed the field of design. As the pace of technological change accelerates, the'),(1015,'principles in this book are increasingly important. The new examples and ideas'),(1062,'about design and about everyday life and leadership are extraordinary.”')]:txt(line,685,y,29,CREAM,anchor='middle')
txt('—PATRICK WHITNEY, Dean, Institute of Design, Steelcase/Robert C. Pew',685,1109,28,MUTED,anchor='middle')
txt('Professor of Design, Illinois Institute of Technology',685,1156,28,MUTED,anchor='middle')
for y,line in [(1240,'“Norman enlightens us on the psychology of people and things and how they interact. He'),(1287,'continues to inspire me as a professor of design. The cumulated insights in this book and the cross-'),(1334,'disciplinary nature of design make The Design of Everyday Things a special treasure and a joy for'),(1381,'designers who are interested in advancing their discipline.”')]:txt(line,685,y,29,CREAM,anchor='middle')
txt('—CEES DE BONT, Dean, School of Design and Chair Professor of',685,1428,28,MUTED,anchor='middle')
txt('Industrial Design, The Hong Kong Polytechnic University',685,1475,28,MUTED,anchor='middle')
txt('DON NORMAN',34,1584,40,RUST,'sans',spacing=1.8)
txt('is a co-founder of the Nielsen Norman Group, and holds graduate degrees',375,1584,29)
rich_line([('in engineering and psychology. His many books include ',False),('Emotional Design',True),(' and ',False),('The Design of Future',True)],34,1632,29)
rich_line([('Things',True),(', and ',False),('Living with Complexity',True),('. He lives in Silicon Valley, California.',False)],34,1680,29)
txt('WWW.JND.ORG',34,1750,32,RUST,'sans',spacing=2)
txt('Cover design by Nicole Caputo',34,1810,27)
txt('Cover image: Jacques Carelman “Coffee Pot for Masochists”',34,1856,27)
txt('© 2013 Artists Rights Society (ARS), New York / ADAGP, Paris',34,1902,26)
txt('BASIC BOOKS',34,1964,43,spacing=5)
txt('A Member of the Perseus Books Group',34,2007,27)
txt('www.basicbooks.com',34,2050,27)
parts.append('<rect x="930" y="1795" width="388" height="270" fill="#ffffff"/>')
txt('ISBN 978-0-465-05065-9',954,1840,16,font='sans')
barcode(Ean13BarcodeWidget(value='9780465050659',barWidth=1,barHeight=100,humanReadable=False),951,1850,218,154)
barcode(Ean5BarcodeWidget(value='51799',barWidth=1,barHeight=100,humanReadable=False),1178,1868,116,136)
txt('5 1 7 9 9',1236,1853,17,font='sans',anchor='middle')
txt('9 780465 050659',1060,2030,17,font='sans',anchor='middle',spacing=1.1)
parts.append('</svg>')
OUT.write_text('\n'.join(parts)+'\n')
print(OUT)
