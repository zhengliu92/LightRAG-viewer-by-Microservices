GRAPH_FIELD_SEP = "<SEP>"

PROMPTS = {}

PROMPTS["DEFAULT_LANGUAGE"] = "CHINESE"
PROMPTS["DEFAULT_TUPLE_DELIMITER"] = "<|>"
PROMPTS["DEFAULT_RECORD_DELIMITER"] = "##"
PROMPTS["DEFAULT_COMPLETION_DELIMITER"] = "<|COMPLETE|>"
PROMPTS["process_tickers"] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
PROMPTS["DESCRIPTION"] = (
    "This prompt is used to extract entities from a research paper or report."
)

PROMPTS["DEFAULT_ENTITY_TYPES"] = [
    "background",
    "experiment",
    "material",
    "phenomenon",
    "methodology",
    "result",
    "conclusion",
    "process",
    "property",
    "product",
    "application",
    "advantages",
    "limitations",
    "figure",
    "table",
]

PROMPTS[
    "entity_extraction"
] = """-Goal-
Given a text document that is potentially relevant to this activity and a list of entity types, identify all entities of those types from the text and all relationships among the identified entities.
Use {language} as output language.

-Steps-
1. Identify all entities. For each identified entity, extract the following information:
- entity_name: Name of the entity, use same language as input text. If English, capitalized the name.
- entity_type: One of the following types: [{entity_types}]. Avoid UNKNOWN entity type.
- entity_description: Comprehensive description of the entity's attributes and activities.
Format each entity as ("entity"{tuple_delimiter}<entity_name>{tuple_delimiter}<entity_type>{tuple_delimiter}<entity_description>)


2. From the entities identified in step 1, identify all pairs of (source_entity, target_entity) that are *clearly related* to each other.
The source entity should be the entity that is clearly influencing the target entity.
For each pair of related entities, extract the following information:
- source_entity: name of the source entity, as identified in step 1
- target_entity: name of the target entity, as identified in step 1
- relationship_description: explanation as to why you think the source entity is influencing the target entity
- relationship_strength: a numeric score indicating strength of the relationship between the source entity and target entity, ranging from 0 to 10
- relationship_keywords: one or more high-level key words that summarize the overarching nature of the relationship, focusing on concepts or themes rather than specific details
Format each relationship as ("relationship"{tuple_delimiter}<source_entity>{tuple_delimiter}<target_entity>{tuple_delimiter}<relationship_description>{tuple_delimiter}<relationship_keywords>{tuple_delimiter}<relationship_strength>)

3. Identify high-level key words that summarize the main concepts, themes, or topics of the entire text. These should capture the overarching ideas present in the document.
Format the content-level key words as ("content_keywords"{tuple_delimiter}<high_level_keywords>)

4. Return output in {language} as a single list of all the entities and relationships identified in steps 1 and 2. Use **{record_delimiter}** as the list delimiter.

5. When finished, output {completion_delimiter}

######################
-Examples-
######################
{examples}

#############################
-Real Data-
######################
Entity_types: {entity_types}
Text: {input_text}
######################
REMEMBER:
The output should be in {language}
######################
Output:
"""


PROMPTS["entity_extraction_examples"] = [
    """Example 1:

Entity_types: [experiment, material, methodology, result, conclusion, process, property, product, application, advantages, limitations, figure, table]
Text:
The study investigates the tensile strength and thermal stability of 6061 Aluminum Alloy under different annealing conditions. The methodology involved high-temperature annealing at 300°C, 400°C, and 500°C for 1-hour intervals. Results showed a marked increase in ductility at 400°C due to grain boundary stabilization. A scanning electron microscope (SEM) analysis provided insights into microstructural changes. The advantages of this process include improved mechanical properties suitable for aerospace applications. However, limitations arise due to a decrease in ultimate tensile strength at higher temperatures.
################
Example 1 Output:
("entity"{tuple_delimiter}"6061 Aluminum Alloy"{tuple_delimiter}"material"{tuple_delimiter}"6061 Aluminum Alloy is the subject of the study, known for its strength, lightweight properties, and versatile applications.")

{record_delimiter}

("entity"{tuple_delimiter}"Tensile Strength"{tuple_delimiter}"property"{tuple_delimiter}"Tensile Strength is a mechanical property indicative of the material's ability to resist deformation under tension.")

{record_delimiter}

("entity"{tuple_delimiter}"Thermal Stability"{tuple_delimiter}"property"{tuple_delimiter}"Thermal Stability measures the material's ability to retain its mechanical properties at elevated temperatures.")

{record_delimiter}

("entity"{tuple_delimiter}"Annealing"{tuple_delimiter}"process"{tuple_delimiter}"Annealing is a heat treatment process applied to improve the material's mechanical and thermal properties.")

{record_delimiter}

("entity"{tuple_delimiter}"Scanning Electron Microscopy (SEM)"{tuple_delimiter}"methodology"{tuple_delimiter}"Scanning Electron Microscopy is a technique employed to study microstructural changes in the material.")

{record_delimiter}

("entity"{tuple_delimiter}"Aerospace Applications"{tuple_delimiter}"application"{tuple_delimiter}"Aerospace Applications highlight the alloy's suitability for the aerospace industry, leveraging its enhanced performance under specific conditions.")

{record_delimiter}

("entity"{tuple_delimiter}"Improved Ductility at 400°C"{tuple_delimiter}"result"{tuple_delimiter}"The study identified improved ductility at 400°C, attributed to grain boundary stabilization.")

{record_delimiter}

("entity"{tuple_delimiter}"Decrease in Ultimate Tensile Strength at Higher Temperatures"{tuple_delimiter}"limitation"{tuple_delimiter}"The observed decrease in ultimate tensile strength at higher temperatures indicates a performance trade-off.")

{record_delimiter}

("relationship"{tuple_delimiter}"Annealing"{tuple_delimiter}"6061 Aluminum Alloy"{tuple_delimiter}"Annealing was performed on 6061 Aluminum Alloy to evaluate changes in its mechanical and thermal properties."{tuple_delimiter}"heat treatment, property enhancement"{tuple_delimiter}9)

{record_delimiter}

("relationship"{tuple_delimiter}"Annealing"{tuple_delimiter}"Tensile Strength"{tuple_delimiter}"Annealing directly affected the tensile strength of the alloy by altering its microstructure."{tuple_delimiter}"process-property interaction"{tuple_delimiter}8)

{record_delimiter}

("relationship"{tuple_delimiter}"Scanning Electron Microscopy (SEM)"{tuple_delimiter}"Microstructural Changes"{tuple_delimiter}"SEM was utilized to observe microstructural changes resulting from annealing in the alloy."{tuple_delimiter}"analysis, microstructure"{tuple_delimiter}7)

{record_delimiter}

("relationship"{tuple_delimiter}"Improved Ductility at 400°C"{tuple_delimiter}"Aerospace Applications"{tuple_delimiter}"The increased ductility at 400°C enhances the alloy's relevance for aerospace applications."{tuple_delimiter}"improved property, industrial relevance"{tuple_delimiter}8)

{record_delimiter}

("content_keywords"{tuple_delimiter}"6061 Aluminum Alloy, tensile strength, annealing, thermal stability, aerospace applications, SEM")

{record_delimiter}


#############################""",
    """Example 2:

Entity_types: [experiment, material, methodology, result, conclusion, process, property, product, application, advantages, limitations, figure, table]
Text:
A novel solid-state electrolyte, Sb-doped Li10P3S12I, was synthesized to enhance lithium-ion conductivity. The process involved ball milling followed by hot pressing under inert conditions. The material demonstrated an ionic conductivity of 1.2 mS/cm at room temperature. X-ray diffraction (XRD) confirmed the crystalline structure, and electrochemical impedance spectroscopy (EIS) was employed to validate the conductivity measurements. The key advantages include enhanced safety and thermal stability for solid-state battery applications. However, challenges in large-scale production remain a significant limitation.
################
Example 2 Output:
("entity"{tuple_delimiter}"Sb-doped Li10P3S12I"{tuple_delimiter}"material"{tuple_delimiter}"Sb-doped Li10P3S12I is an advanced solid-state electrolyte developed to enhance lithium-ion conductivity for battery applications.")

{record_delimiter}

("entity"{tuple_delimiter}"Ball Milling and Hot Pressing"{tuple_delimiter}"process"{tuple_delimiter}"Ball Milling and Hot Pressing are the synthesis processes conducted under inert conditions to fabricate Sb-doped Li10P3S12I.")

{record_delimiter}

("entity"{tuple_delimiter}"Ionic Conductivity"{tuple_delimiter}"property"{tuple_delimiter}"Ionic Conductivity is a key property of the electrolyte, measured at 1.2 mS/cm, indicative of its high ion transport efficiency.")

{record_delimiter}

("entity"{tuple_delimiter}"X-ray Diffraction (XRD)"{tuple_delimiter}"methodology"{tuple_delimiter}"X-ray Diffraction is a characterization technique used to verify the crystalline structure of the synthesized material.")

{record_delimiter}

("entity"{tuple_delimiter}"Electrochemical Impedance Spectroscopy (EIS)"{tuple_delimiter}"methodology"{tuple_delimiter}"Electrochemical Impedance Spectroscopy is a technique employed to measure and validate the ionic conductivity of the material.")

{record_delimiter}

("entity"{tuple_delimiter}"Solid-State Battery Applications"{tuple_delimiter}"application"{tuple_delimiter}"Solid-State Battery Applications utilize the material for enhanced safety, stability, and performance in energy storage devices.")

{record_delimiter}

("entity"{tuple_delimiter}"Challenges in Large-scale Production"{tuple_delimiter}"limitation"{tuple_delimiter}"Challenges in Large-scale Production include technical and economic barriers to manufacturing the material at an industrial scale.")

{record_delimiter}

("relationship"{tuple_delimiter}"Ball Milling and Hot Pressing"{tuple_delimiter}"Sb-doped Li10P3S12I"{tuple_delimiter}"Ball Milling and Hot Pressing were used to synthesize the Sb-doped Li10P3S12I electrolyte under controlled conditions."{tuple_delimiter}"synthesis, material preparation"{tuple_delimiter}9)

{record_delimiter}

("relationship"{tuple_delimiter}"Sb-doped Li10P3S12I"{tuple_delimiter}"Ionic Conductivity"{tuple_delimiter}"The material exhibits high ionic conductivity, a critical property for its application in solid-state batteries."{tuple_delimiter}"material-property correlation"{tuple_delimiter}9)

{record_delimiter}

("relationship"{tuple_delimiter}"X-ray Diffraction (XRD)"{tuple_delimiter}"Sb-doped Li10P3S12I"{tuple_delimiter}"XRD confirmed the crystalline structure of Sb-doped Li10P3S12I, ensuring material consistency and quality."{tuple_delimiter}"characterization, structural analysis"{tuple_delimiter}8)

{record_delimiter}

("relationship"{tuple_delimiter}"Ionic Conductivity"{tuple_delimiter}"Solid-State Battery Applications"{tuple_delimiter}"The material's high ionic conductivity enhances its suitability for use in solid-state battery applications."{tuple_delimiter}"property-application correlation"{tuple_delimiter}8)

{record_delimiter}

("relationship"{tuple_delimiter}"Challenges in Large-scale Production"{tuple_delimiter}"Sb-doped Li10P3S12I"{tuple_delimiter}"Large-scale production challenges influence the feasibility of deploying Sb-doped Li10P3S12I in commercial applications."{tuple_delimiter}"scaling limitations, manufacturing challenges"{tuple_delimiter}7)

{record_delimiter}

("content_keywords"{tuple_delimiter}"solid-state electrolyte, Sb-doped Li10P3S12I, ionic conductivity, synthesis, battery applications")

{completion_delimiter}

#############################""",
    """Example 3:

Entity_types: [experiment, material, methodology, result, conclusion, process, property, product, application, advantages, limitations, figure, table]
Text:
Researchers developed a polymer composite reinforced with graphene oxide (GO) nanosheets for enhanced mechanical and thermal properties. The composite, referred to as GO/Polymer, was fabricated using solution casting, followed by curing at elevated temperatures. The study provided a detailed analysis of the composite’s tensile strength, thermal stability, and electrical conductivity.

Figure 1 illustrates the microstructure of the GO/Polymer composite, highlighting the uniform dispersion of graphene oxide within the polymer matrix. Table 1 summarizes the mechanical properties of the composite compared to the pristine polymer. The results showed a 50% improvement in tensile strength and a 30% increase in thermal stability. However, the study also noted limitations, such as reduced flexibility at higher GO concentrations. The composite's applications in electronics and aerospace were discussed, with emphasis on its lightweight and conductive nature.
################
Example 3 Output:

("entity"{tuple_delimiter}"GO/Polymer Composite"{tuple_delimiter}"material"{tuple_delimiter}"The GO/Polymer Composite is a hybrid material reinforced with graphene oxide nanosheets, offering enhanced mechanical, thermal, and electrical properties.")

{record_delimiter}

("entity"{tuple_delimiter}"Graphene Oxide (GO)"{tuple_delimiter}"material"{tuple_delimiter}"Graphene Oxide is a nanoscale reinforcement material known for its excellent mechanical, thermal, and electrical conductivity improvements.")

{record_delimiter}

("entity"{tuple_delimiter}"Solution Casting and Curing"{tuple_delimiter}"process"{tuple_delimiter}"Solution Casting and Curing are fabrication processes used to produce the GO/Polymer Composite, ensuring uniform dispersion of graphene oxide.")

{record_delimiter}

("entity"{tuple_delimiter}"Tensile Strength"{tuple_delimiter}"property"{tuple_delimiter}"Tensile Strength indicates the material's resistance to breaking under tension, showing a 50% improvement over the pristine polymer.")

{record_delimiter}

("entity"{tuple_delimiter}"Thermal Stability"{tuple_delimiter}"property"{tuple_delimiter}"Thermal Stability measures the material's resistance to thermal degradation, increased by 30% in the GO/Polymer Composite.")

{record_delimiter}

("entity"{tuple_delimiter}"Electrical Conductivity"{tuple_delimiter}"property"{tuple_delimiter}"Electrical Conductivity defines the material's capacity to conduct electricity, significantly improved by the addition of graphene oxide.")

{record_delimiter}

("entity"{tuple_delimiter}"Figure 1"{tuple_delimiter}"figure"{tuple_delimiter}"Figure 1 illustrates the microstructure of the GO/Polymer Composite, emphasizing the uniform dispersion of graphene oxide nanosheets.")

{record_delimiter}

("entity"{tuple_delimiter}"Table 1"{tuple_delimiter}"table"{tuple_delimiter}"Table 1 presents comparative data on mechanical properties, highlighting the improvements in tensile strength and thermal stability of the composite.")

{record_delimiter}

("entity"{tuple_delimiter}"Electronics and Aerospace Applications"{tuple_delimiter}"application"{tuple_delimiter}"These applications exploit the composite's lightweight, conductive, and high-performance characteristics for advanced technologies.")

{record_delimiter}

("entity"{tuple_delimiter}"Reduced Flexibility at Higher GO Concentrations"{tuple_delimiter}"limitation"{tuple_delimiter}"Increased concentrations of graphene oxide in the composite result in reduced flexibility, presenting a trade-off in material performance.")

{record_delimiter}

("relationship"{tuple_delimiter}"Graphene Oxide (GO)"{tuple_delimiter}"GO/Polymer Composite"{tuple_delimiter}"Graphene Oxide is incorporated into the polymer matrix to reinforce the composite, enhancing its mechanical and thermal properties."{tuple_delimiter}"reinforcement, material enhancement"{tuple_delimiter}9)

{record_delimiter}

("relationship"{tuple_delimiter}"Solution Casting and Curing"{tuple_delimiter}"GO/Polymer Composite"{tuple_delimiter}"Solution Casting and Curing are key processes used to fabricate the GO/Polymer Composite, ensuring homogeneous material synthesis."{tuple_delimiter}"fabrication, process-methodology"{tuple_delimiter}8)

{record_delimiter}

("relationship"{tuple_delimiter}"Table 1"{tuple_delimiter}"Tensile Strength"{tuple_delimiter}"Table 1 documents the 50% increase in tensile strength compared to the pristine polymer, quantifying the composite's mechanical improvement."{tuple_delimiter}"quantification, property comparison"{tuple_delimiter}7)

{record_delimiter}

("relationship"{tuple_delimiter}"Figure 1"{tuple_delimiter}"Thermal Stability"{tuple_delimiter}"Figure 1 visually supports the composite's improved thermal stability by demonstrating the uniform dispersion of graphene oxide."{tuple_delimiter}"visualization, property analysis"{tuple_delimiter}6)

{record_delimiter}

("relationship"{tuple_delimiter}"GO/Polymer Composite"{tuple_delimiter}"Electronics and Aerospace Applications"{tuple_delimiter}"The enhanced properties of the GO/Polymer Composite make it highly suitable for advanced electronics and aerospace applications."{tuple_delimiter}"application relevance, industrial use"{tuple_delimiter}8)

{record_delimiter}

("content_keywords"{tuple_delimiter}"polymer composite, graphene oxide, tensile strength, thermal stability, solution casting, aerospace applications, electronics")

{completion_delimiter}


{completion_delimiter}
#############################""",
]

PROMPTS[
    "summarize_entity_descriptions"
] = """You are a helpful assistant responsible for generating a comprehensive summary of the data provided below.
Given one or two entities, and a list of descriptions, all related to the same entity or group of entities.
Please concatenate all of these into a single, comprehensive description. Make sure to include information collected from all the descriptions.
If the provided descriptions are contradictory, please resolve the contradictions and provide a single, coherent summary.
Make sure it is written in third person, and include the entity names so we the have full context.
Use {language} as output language.

#######
-Data-
Entities: {entity_name}
Description List: {description_list}
#######
Output:
"""


PROMPTS[
    "entiti_continue_extraction"
] = """MANY entities were missed in the last extraction.  Add them below using the same format:
"""

PROMPTS[
    "entiti_if_loop_extraction"
] = """It appears some entities may have still been missed.  Answer YES | NO if there are still entities that need to be added.
"""

PROMPTS["fail_response"] = (
    "不好意思，我无法回答这个问题。 您可以尝试将提问方法设置为global，来从全局的角度回答这个问题。"
)
PROMPTS[
    "rag_response"
] = """---Role---

You are a helpful assistant responding to questions about data in the tables provided.


---Goal---

Generate a response of the target length and format that responds to the user's question, summarizing all information in the input data tables appropriate for the response length and format, and incorporating any relevant general knowledge.
If you don't know the answer, just say so. Do not make anything up.
Do not include information where the supporting evidence for it is not provided.

---Target response length and format---

{response_type}

---Data tables---

{context_data}

Add sections and commentary to the response as appropriate for the length and format. Style the response in markdown.
"""

PROMPTS[
    "keywords_extraction"
] = """---Role---

You are a helpful assistant tasked with identifying both high-level and low-level keywords in the user's query.

---Goal---

Given the query, list both high-level and low-level keywords. High-level keywords focus on overarching concepts or themes, while low-level keywords focus on specific entities, details, or concrete terms.

---Instructions---

- Output the keywords in JSON format.
- The JSON should have two keys:
  - "high_level_keywords" for overarching concepts or themes.
  - "low_level_keywords" for specific entities or details.

######################
-Examples-
######################
{examples}

#############################
-Real Data-
######################
Query: {query}
######################
The `Output` should be human text, not unicode characters. Keep the same language as `Query`.
Output:

"""

PROMPTS["keywords_extraction_examples"] = [
    """Example 1:

Query: "What are the key factors influencing the mechanical properties of aluminum alloys?"
################
Output:
{{
  "high_level_keywords": ["Mechanical properties", "Aluminum alloys", "Material performance"],
  "low_level_keywords": ["Microstructure", "Heat treatment", "Alloying elements", "Tensile strength", "Fatigue resistance"]
}}
#############################""",
    """Example 2:

Query: "How do dopants affect the ionic conductivity in solid-state electrolytes?"
################
Output:
{{
  "high_level_keywords": ["Dopants", "Ionic conductivity", "Solid-state electrolytes"],
  "low_level_keywords": ["Li10P3S12", "Doping mechanisms", "Activation energy", "Lithium-ion mobility", "Electrochemical stability"]
}}
#############################""",
    """Example 3:

Query: "What are the challenges in scaling up the synthesis of nanomaterials for industrial applications?"
################
Output:
{{
  "high_level_keywords": ["Scaling up", "Nanomaterials", "Industrial applications"],
  "low_level_keywords": ["Batch uniformity", "Process optimization", "Cost-efficiency", "Environmental impact", "Surface modifications"]
}}
#############################""",
]


PROMPTS[
    "naive_rag_response"
] = """---Role---

You are a helpful assistant responding to questions about documents provided.


---Goal---

Generate a response of the target length and format that responds to the user's question, summarizing all information in the input data tables appropriate for the response length and format, and incorporating any relevant general knowledge.
If you don't know the answer, just say so. Do not make anything up.
Do not include information where the supporting evidence for it is not provided.

---Target response length and format---

{response_type}

---Documents---

{content_data}

Add sections and commentary to the response as appropriate for the length and format. Style the response in markdown.
"""

PROMPTS[
    "similarity_check"
] = """Please analyze the similarity between these two questions:

Question 1: {original_prompt}
Question 2: {cached_prompt}

Please evaluate the following two points and provide a similarity score between 0 and 1 directly:
1. Whether these two questions are semantically similar
2. Whether the answer to Question 2 can be used to answer Question 1
Similarity score criteria:
0: Completely unrelated or answer cannot be reused, including but not limited to:
   - The questions have different topics
   - The locations mentioned in the questions are different
   - The times mentioned in the questions are different
   - The specific individuals mentioned in the questions are different
   - The specific events mentioned in the questions are different
   - The background information in the questions is different
   - The key conditions in the questions are different
1: Identical and answer can be directly reused
0.5: Partially related and answer needs modification to be used
Return only a number between 0-1, without any additional content.
"""
